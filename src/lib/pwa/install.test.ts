import { describe, expect, it } from "vitest";
import { installMode, isIosDevice } from "./install";

describe("installMode", () => {
  it("diz que já está instalado quando o app abre sozinho (tela inicial)", () => {
    expect(installMode({ standalone: true, canPrompt: true, ios: false })).toBe("instalado");
  });

  it("oferece o botão quando o navegador permite instalar (Chrome no Android)", () => {
    expect(installMode({ standalone: false, canPrompt: true, ios: false })).toBe("botao");
  });

  it("mostra o passo a passo do Compartilhar no iPhone", () => {
    expect(installMode({ standalone: false, canPrompt: false, ios: true })).toBe("ios");
  });

  it("mostra o caminho pelo menu do navegador nos demais casos", () => {
    expect(installMode({ standalone: false, canPrompt: false, ios: false })).toBe("manual");
  });
});

describe("isIosDevice", () => {
  it("reconhece iPhone", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
    expect(isIosDevice(ua, 5)).toBe(true);
  });

  it("reconhece iPad, que se apresenta como Mac com tela de toque", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
    expect(isIosDevice(ua, 5)).toBe(true);
  });

  it("não confunde Mac de mesa nem Android", () => {
    const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
    const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
    expect(isIosDevice(mac, 0)).toBe(false);
    expect(isIosDevice(android, 5)).toBe(false);
  });
});
