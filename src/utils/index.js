export function removeElementByCreatingNewArray(array, elementCompareFunction) {
  if (
    !array ||
    !array.length ||
    !elementCompareFunction
  ) return []

  const index = array.findIndex(elementCompareFunction)

  // If element is not found, return a copy
  // of array.
  if (index === -1) return [...array]

  return [
    ...array.slice(0, index),
    ...array.slice(index + 1)
  ]
}
