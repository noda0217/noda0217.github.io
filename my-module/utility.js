export function compareArray(arrayBig, arraySmall) {
  let arrayResult = arrayBig.map((value, index) => {
    return value > arraySmall[index] ? 1 : 0
  })
  return arrayResult
}
