import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Aplica o tema salvo antes da hidratação, evitando o "piscar" do tema claro.
 * O tema claro é o padrão; o escuro só entra quando o usuário escolhe.
 */
export function ThemeScript() {
  const script = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="escuro")document.documentElement.classList.add("dark")}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
