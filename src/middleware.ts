import { withAuth } from "next-auth/middleware";

// O middleware só confirma que há sessão. Papel (treinador/cliente) e "mudar password"
// são decididos nas páginas com os dados atuais da base de dados (requirePageUser),
// para que um token antigo nunca entre em conflito com a base de dados (ciclo de redireções).
export default withAuth({ pages: { signIn: "/" } });

export const config = {
  matcher: ["/app/:path*", "/treinador/:path*", "/change-password"],
};
