import { createCn } from "cn/config"

// Ensina ao merge de classes a escala tipográfica e a sombra de foco do Lúmen;
// sem isso, `text-body-sm` (tamanho) e `text-ink` (cor) seriam tratados como conflito.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-lg",
            "display-md",
            "title",
            "body",
            "body-sm",
            "label",
            "code",
          ],
        },
      ],
      shadow: [{ shadow: ["focus"] }],
    },
  },
})
