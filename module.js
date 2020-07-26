function readJSON(filePath) {
  let json = {}
  fetch(filePath)
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      json = data
    })
  return json
}

function compareArray(arrayBig, arraySmall) {
  let arrayResult = arrayBig.map((value, index) => {
    return value > arraySmall[index] ? 1 : 0
  })
  return arrayResult
}

function minOfArray(array) {
  return array.reduce((a, b) => {
    return a > b ? b : a
  })
}

function maxOfArray(array) {
  return array.reduce((a, b) => {
    return a > b ? a : b
  })
}

function duration(V1, V2, IR1, IR2) {
  return (
    (Math.log(V1) - Math.log(V2)) /
    (Math.log(1 + IR2 / 100) - Math.log(1 + IR1 / 100))
  )
}

function normDist(mu, sigma) {
  let X = Math.random()
  let Y = Math.random()
  return mu + sigma * Math.sqrt(-2 * Math.log(X)) * Math.cos(2 * Math.PI * Y)
}
function changeWithDuration(V, IR1, IR2, duration) {
  return Math.round(V * ((1 + IR1 / 100) / (1 + IR2 / 100)) ** duration)
}

function simulate(){

  this.pred.Fs = []
  for (let i = 1; i <= this.count; i++) {
    let predF = [...Array(this.span + 1)].map(() => {
      return 0
    })
    predF[0] = this.initData['F']

    for (let n = 1; n < this.span + 1; n++) {
      let X = Math.random()
      let Y = Math.random()
      let r = this.normDist(this.ER / 100, this.SD / 100, X, Y)
      predF[n] = Math.round(
        predF[n - 1] * (1 + r) +
          (this.pred.C[n] - this.pred.B[n]) * (1 + r) ** 0.5
      )
    }
    this.pred.Fs.push(predF)
  }

  let labels = this.makeLabels(this.span)
  let datasets = this.makeDatasets(this.pred.V, this.pred.Fs)

  this.drawGraph(labels, datasets)
  document.getElementById('simulate').blur()
}