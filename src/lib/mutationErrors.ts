export function translateMutationError(error: any): string {
  const msg = error?.message || "";
  if (msg.includes("duplicate key")) return "Já existe um registro com essas informações.";
  if (msg.includes("foreign key")) return "Este registro está vinculado a outros dados e não pode ser removido.";
  if (msg.includes("not null")) return "Preencha todos os campos obrigatórios.";
  if (msg.includes("permission denied")) return "Você não tem permissão para realizar esta ação.";
  if (msg.includes("JWT")) return "Sua sessão expirou. Faça login novamente.";
  return "Ocorreu um erro. Tente novamente.";
}
