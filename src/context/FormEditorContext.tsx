import { createContext, useContext, useReducer, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { NexusForm, FormBlock, FormStyling, FormSettings } from "@/types/forms";
import { toast } from "sonner";

// ── State ──
interface EditorState {
  form: NexusForm;
  selectedBlockId: string | null;
  undoStack: NexusForm[];
  redoStack: NexusForm[];
  isDirty: boolean;
  isSaving: boolean;
  previewMode: "desktop" | "mobile";
}

type Action =
  | { type: "SET_FORM"; form: NexusForm }
  | { type: "SELECT_BLOCK"; id: string | null }
  | { type: "ADD_BLOCK"; block: FormBlock; afterId?: string }
  | { type: "UPDATE_BLOCK"; id: string; updates: Partial<FormBlock> }
  | { type: "REMOVE_BLOCK"; id: string }
  | { type: "REORDER_BLOCKS"; blocks: FormBlock[] }
  | { type: "UPDATE_STYLING"; styling: Partial<FormStyling> }
  | { type: "UPDATE_SETTINGS"; settings: Partial<FormSettings> }
  | { type: "UPDATE_NAME"; name: string }
  | { type: "UPDATE_STATUS"; status: NexusForm["status"] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "MARK_SAVED" }
  | { type: "SET_SAVING"; saving: boolean }
  | { type: "SET_PREVIEW_MODE"; mode: "desktop" | "mobile" };

const MAX_UNDO = 30;

function pushUndo(state: EditorState): Pick<EditorState, "undoStack" | "redoStack"> {
  return {
    undoStack: [...state.undoStack.slice(-MAX_UNDO), state.form],
    redoStack: [],
  };
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_FORM":
      return { ...state, form: action.form, isDirty: false, undoStack: [], redoStack: [], selectedBlockId: null };

    case "SELECT_BLOCK":
      return { ...state, selectedBlockId: action.id };

    case "ADD_BLOCK": {
      const undo = pushUndo(state);
      const blocks = [...state.form.blocks];
      const idx = action.afterId ? blocks.findIndex(b => b.id === action.afterId) + 1 : blocks.length - 1; // before ending
      blocks.splice(Math.max(1, idx), 0, action.block); // after welcome
      return { ...state, ...undo, form: { ...state.form, blocks }, selectedBlockId: action.block.id, isDirty: true };
    }

    case "UPDATE_BLOCK": {
      const undo = pushUndo(state);
      const blocks = state.form.blocks.map(b => b.id === action.id ? { ...b, ...action.updates } as FormBlock : b);
      return { ...state, ...undo, form: { ...state.form, blocks }, isDirty: true };
    }

    case "REMOVE_BLOCK": {
      const undo = pushUndo(state);
      const blocks = state.form.blocks.filter(b => b.id !== action.id);
      const sel = state.selectedBlockId === action.id ? null : state.selectedBlockId;
      return { ...state, ...undo, form: { ...state.form, blocks }, selectedBlockId: sel, isDirty: true };
    }

    case "REORDER_BLOCKS": {
      const undo = pushUndo(state);
      return { ...state, ...undo, form: { ...state.form, blocks: action.blocks }, isDirty: true };
    }

    case "UPDATE_STYLING": {
      const undo = pushUndo(state);
      return { ...state, ...undo, form: { ...state.form, styling: { ...state.form.styling, ...action.styling } }, isDirty: true };
    }

    case "UPDATE_SETTINGS": {
      const undo = pushUndo(state);
      return { ...state, ...undo, form: { ...state.form, settings: { ...state.form.settings, ...action.settings } }, isDirty: true };
    }

    case "UPDATE_NAME":
      return { ...state, form: { ...state.form, name: action.name }, isDirty: true };

    case "UPDATE_STATUS":
      return { ...state, form: { ...state.form, status: action.status }, isDirty: true };

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        form: prev,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.form],
        isDirty: true,
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        form: next,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.form],
        isDirty: true,
      };
    }

    case "MARK_SAVED":
      return { ...state, isDirty: false, isSaving: false };

    case "SET_SAVING":
      return { ...state, isSaving: action.saving };

    case "SET_PREVIEW_MODE":
      return { ...state, previewMode: action.mode };

    default:
      return state;
  }
}

// ── Context ──
interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useFormEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useFormEditor must be used within FormEditorProvider");
  return ctx;
}

const emptyForm: NexusForm = {
  id: "", name: "Novo Formulário", status: "draft", type: "link",
  blocks: [], variables: [], responseCount: 0, completionRate: 0, avgResponseTime: 0,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  styling: {
    brandColor: "hsl(0 84% 60%)", accentColor: "hsl(0 84% 50%)",
    backgroundColor: "hsl(240 5% 6%)", cardColor: "hsl(240 4% 10%)",
    textColor: "hsl(0 0% 98%)", fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: 12, cardArrangement: "straight", backgroundType: "color",
  },
  settings: {
    allowMultipleResponses: false, requireEmail: false, isPublic: true,
    progressBar: true, backButton: true,
  },
};

export function FormEditorProvider({ initialForm, children }: { initialForm?: NexusForm; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    form: initialForm || emptyForm,
    selectedBlockId: null,
    undoStack: [],
    redoStack: [],
    isDirty: false,
    isSaving: false,
    previewMode: "desktop",
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auto-save every 30s
  const saveTimerRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      if (state.isDirty && !state.isSaving) {
        dispatch({ type: "SET_SAVING", saving: true });
        // Mock save - in real app this would persist to Supabase
        setTimeout(() => {
          dispatch({ type: "MARK_SAVED" });
          toast.success("Formulário salvo automaticamente", { duration: 2000 });
        }, 500);
      }
    }, 30000);
    return () => clearInterval(saveTimerRef.current);
  }, [state.isDirty, state.isSaving]);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  return (
    <EditorContext.Provider value={{
      state, dispatch, undo, redo,
      canUndo: state.undoStack.length > 0,
      canRedo: state.redoStack.length > 0,
    }}>
      {children}
    </EditorContext.Provider>
  );
}
