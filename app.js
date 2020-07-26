import * as module from '/module.js'
let data = {
  initData: {},

  span: 15,
  V: 0,
  C: 0,
  IR: 2, //%
  ER: 2, //%
  SD: 7, //%
  pred: {
    Fs: [],
    V: [],
    C: [],
    B: [],
  },
  durV: 0,
  durC: 0,
  count: 10,
  limit: true,
}

let app = new Vue({
  el: '#app',
  data,
  
  methods: {


    makeLabels: function (span) {
      return [...Array(span + 1)].map((value, index) => index)
    },

    makeDatasets: function (predV, predFs) {
      let datasets = []
      let dataV = {
        type: 'line',
        label: '負債',
        data: predV,
        yAxisID: 'y-axis-1',
        borderColor: 'rgba(35, 188, 249, 0)',
        backgroundColor: 'rgba(249, 96, 35, 0.3)',
        pointRadius: 0,
      }

      datasets.push(dataV)

      for (predF of predFs) {
        let templateF = {
          type: 'line',
          label: '資産',
          data: [],
          yAxisID: 'y-axis-1',
          borderColor: 'rgba(35, 188, 249, 0.5)',
          backgroundColor: 'rgba(122,192,239,0)',
          borderWidth: 1,
          pointRadius: 0,
        }
        templateF['data'] = predF
        datasets.push(templateF)
      }

      return datasets
    },
    
    drawGraph: function (labels, datasets) {
      let ctxCurrent = document.getElementById('currentStatus')
      new Chart(ctxCurrent, {
        type: 'bar',
        data: {
          labels: ['第１案', '第２案', '変更案'],
          datasets: [
            {
              label: '負債',
              stack: 'Stack0',
              data: [this.initData['V'], this.initData['Vsub'], this.pred.V[0]],
              backgroundColor: 'rgba(249, 96, 35, 0.3)',
            },
            {
              label: '資産',
              stack: 'Stack1',
              data: [
                this.initData['F'],
                this.initData['F'],
                this.initData['F'],
              ],
              backgroundColor: 'rgba(35, 188, 249, 0.3)',
            },

            {
              label: '不足',
              stack: 'Stack1',
              data: [
                Math.max(0, this.initData['V'] - this.initData['F']),
                Math.max(0, this.initData['Vsub'] - this.initData['F']),
                Math.max(0, this.pred.V[0] - this.initData['F']),
              ],
              backgroundColor: 'rgba(249, 96, 35, 1)',
            },
            {
              label: '剰余',
              stack: 'Stack0',
              data: [
                Math.max(0, this.initData['F'] - this.initData['V']),
                Math.max(0, this.initData['F'] - this.initData['Vsub']),
                Math.max(0, this.initData['F'] - this.pred.V[0]),
              ],
              backgroundColor: 'rgba(35, 188, 249, 1)',
            },
          ],
        },
        options: {
          title: {
            display: true,
            text: '基準日時点の財政状況',
          },
          responsive: true,
          scales: {
            xAxes: [{ categoryPercentage: 0.8, barPercentage: 1.0 }],
            yAxes: [
              {
                id: 'y-axis-1', // Y軸のID
                scaleLabel: {
                  display: true,
                  labelString: '（百万円）',
                },
                type: 'linear', // linear固定
                position: 'left', // どちら側に表示される軸か？
                ticks: {
                  maxTicksLimit: 10,
                  min: 0,
                },
              },
            ],
          },
        },
      })

      let ctxPred = document.getElementById('prediction')
      new Chart(ctxPred, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          title: {
            display: true,
            text: '将来の財政状況',
          },
          legend: {
            onClick: function (e, legendItem) {
              //凡例がクリックされたら同ラベルのデータの表示/非表示も切り替えられるようにデフォルトのイベントハンドラーを修正
              let targetLabel = legendItem.text
              let ci = this.chart
              let datasets = ci.data.datasets
              datasets.forEach((value, index) => {
                if (value['label'] === targetLabel) {
                  let meta = ci.getDatasetMeta(index)
                  meta.hidden =
                    meta.hidden === null
                      ? !ci.data.datasets[index].hidden
                      : null
                }
              })
              ci.update()
            },
            display: true,
            labels: {
              filter: (items, chartData) => {
                //すでに出てきたlegendは表示しないフィルター
                let index = items.datasetIndex
                let dataBeforeIndex = chartData.datasets.slice(0, index)
                let frag = dataBeforeIndex.some((itemsOfList) => {
                  return itemsOfList['label'] === items['text']
                })
                return frag !== true
              },
            },
          },
          responsive: true,
          scales: {
            xAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: '推移年度',
                },
                ticks: {
                  maxTicksLimit: 10,
                },
              },
            ],
            yAxes: [
              {
                id: 'y-axis-1', // Y軸のID
                scaleLabel: {
                  display: true,
                  labelString: '（百万円）',
                },
                type: 'linear', // linear固定
                position: 'left', // どちら側に表示される軸か？
                ticks: {
                  maxTicksLimit: 10,
                  min: Math.min(this.minOfArray(this.pred.V), 0),
                },
              },
            ],
          },
        },
      })
    },
  },
})
