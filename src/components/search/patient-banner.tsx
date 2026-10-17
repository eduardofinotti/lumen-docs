/** Aviso permanente acima da caixa de pergunta. Linha única, sem fundo. */
export function PatientBanner() {
  return (
    <p className="text-body-sm text-danger">
      Não insira nome, CPF ou qualquer dado que identifique um paciente.
    </p>
  );
}
