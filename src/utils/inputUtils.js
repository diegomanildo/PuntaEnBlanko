// input[type=number] de HTML acepta "e"/"E" (notación científica) y "+"/"-",
// que no tienen sentido en precios, cantidades ni stock. Bloquea esas teclas.
export const bloquearNoNumerico = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
};
