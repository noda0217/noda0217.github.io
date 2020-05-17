let app = new Vue({
  el: "#app",
  data: function () {
    return {
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
    };
  },

  methods: {
    //二つの配列を比較して、arrayBig>arrySmallのindexのvalueを1とする
    compareArrays: function (arrayBig, arraySmall) {
      let arrayResult = arrayBig.map((value, index) => {
        return value > arraySmall[index] ? 1 : 0;
      });
      return arrayResult;
    },
    calDurV: function () {
      return (
        (Math.log(this.initData["V"]) - Math.log(this.initData["Vsub"])) /
        (Math.log(1 + this.initData["IRsub"] / 100) -
          Math.log(1 + this.initData["IR"] / 100))
      );
    },
    calDurC: function () {
      return (
        (Math.log(this.initData["C"]) - Math.log(this.initData["Csub"])) /
        (Math.log(1 + this.initData["IRsub"] / 100) -
          Math.log(1 + this.initData["IR"] / 100))
      );
    },

    calV: function (IR, durV) {
      return Math.round(
        this.initData["V"] *
          ((1 + this.initData["IR"] / 100) / (1 + IR / 100)) ** durV
      );
    },

    calC: function (IR, durC) {
      return Math.round(
        this.initData["C"] *
          ((1 + this.initData["IR"] / 100) / (1 + IR / 100)) ** durC
      );
    },
    csvToObject: function (csv) {
      //csv: col1 is header, col2 is data
      let obj1 = csv.split("\n");
      let obj2 = {};
      for (let row of obj1) {
        let rowSplited = row.split(",");
        obj2[rowSplited[0]] = parseInt(rowSplited[1].trim());
      }
      return obj2;
    },

    normDist: function (mu, sigma, randomX, randomY) {
      return (
        mu +
        sigma *
          Math.sqrt(-2 * Math.log(randomX)) *
          Math.cos(2 * Math.PI * randomY)
      );
    },

    minOfArray: function (array) {
      return array.reduce((a, b) => {
        return a > b ? b : a;
      });
    },
    maxOfArray: function (array) {
      return array.reduce((a, b) => {
        return a > b ? a : b;
      });
    },
    readJSON: function () {
      this.initDataTable = true;
      fetch("./initData.json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.initData = data;
        });

      document.getElementById("readJSON").blur();
    },
    readCSV: function () {
      this.initDataTable = true;

      fetch("./initData.csv")
        .then((response) => {
          return response.text();
        })
        .then((response) => {
          this.initData = this.csvToObject(response);
        });

      document.getElementById("readCSV").blur();
    },

    simulate: function () {
      this.durC = this.calDurC();
      this.durV = this.calDurV();
      this.V = this.calV(this.IR, this.durV);
      this.C = this.calC(this.IR, this.durC);

      this.pred.C = [...Array(this.span + 1)].map(() => {
        return this.C;
      });
      this.pred.B = [...Array(this.span + 1)].map(() => {
        return this.initData["B"];
      });

      this.pred.V = [...Array(this.span + 1)].map(() => {
        return 0;
      });

      this.pred.V[0] = this.V;
      for (let n = 1; n < this.span + 1; n++) {
        let i = this.IR / 100;
        this.pred.V[n] = Math.round(
          this.pred.V[n - 1] * (1 + i) +
            (this.pred.C[n] - this.pred.B[n]) * (1 + i) ** 0.5
        );
      }

      this.pred.Fs = [];
      for (let i = 1; i <= this.count; i++) {
        let predF = [...Array(this.span + 1)].map(() => {
          return 0;
        });
        predF[0] = this.initData["F"];

        for (let n = 1; n < this.span + 1; n++) {
          let X = Math.random();
          let Y = Math.random();
          let r = this.normDist(this.ER / 100, this.SD / 100, X, Y);
          predF[n] = Math.round(
            predF[n - 1] * (1 + r) +
              (this.pred.C[n] - this.pred.B[n]) * (1 + r) ** 0.5
          );
        }
        this.pred.Fs.push(predF);
      }

      let labels = this.makeLabels(this.span);
      let datasets = this.makeDatasets(this.pred.V, this.pred.Fs);

      this.drawGraph(labels, datasets);
      document.getElementById("simulate").blur();
    },

    makeLabels: function (span) {
      return [...Array(span + 1)].map((value, index) => index);
    },

    makeDatasets: function (predV, predFs) {
      let datasets = [];
      let dataV = {
        type: "line",
        label: "負債",
        data: predV,
        yAxisID: "y-axis-1",
        borderColor: "rgba(35, 188, 249, 0)",
        backgroundColor: "rgba(249, 96, 35, 0.3)",
        pointRadius: 0,
      };

      datasets.push(dataV);

      for (predF of predFs) {
        let templateF = {
          type: "line",
          label: "資産",
          data: [],
          yAxisID: "y-axis-1",
          borderColor: "rgba(35, 188, 249, 0.5)",
          backgroundColor: "rgba(122,192,239,0)",
          borderWidth: 1,
          pointRadius: 0,
        };
        templateF["data"] = predF;
        datasets.push(templateF);
      }

      return datasets;
    },
    drawGraph: function (labels, datasets) {
      let ctxCurrent = document.getElementById("currentStatus");
      new Chart(ctxCurrent, {
        type: "bar",
        data: {
          labels: ["第１案", "第２案", "変更案"],
          datasets: [
            {
              label: "負債",
              stack: "Stack0",
              data: [this.initData["V"], this.initData["Vsub"], this.pred.V[0]],
              backgroundColor: "rgba(249, 96, 35, 0.3)",
            },
            {
              label: "資産",
              stack: "Stack1",
              data: [
                this.initData["F"],
                this.initData["F"],
                this.initData["F"],
              ],
              backgroundColor: "rgba(35, 188, 249, 0.3)",
            },

            {
              label: "不足",
              stack: "Stack1",
              data: [
                Math.max(0, this.initData["V"] - this.initData["F"]),
                Math.max(0, this.initData["Vsub"] - this.initData["F"]),
                Math.max(0, this.pred.V[0] - this.initData["F"]),
              ],
              backgroundColor: "rgba(249, 96, 35, 1)",
            },
            {
              label: "剰余",
              stack: "Stack0",
              data: [
                Math.max(0, this.initData["F"] - this.initData["V"]),
                Math.max(0, this.initData["F"] - this.initData["Vsub"]),
                Math.max(0, this.initData["F"] - this.pred.V[0]),
              ],
              backgroundColor: "rgba(35, 188, 249, 1)",
            },
          ],
        },
        options: {
          title: {
            display: true,
            text: "基準日時点の財政状況",
          },
          responsive: true,
          scales: {
            xAxes: [{ categoryPercentage: 0.8, barPercentage: 1.0 }],
            yAxes: [
              {
                id: "y-axis-1", // Y軸のID
                scaleLabel: {
                  display: true,
                  labelString: "（百万円）",
                },
                type: "linear", // linear固定
                position: "left", // どちら側に表示される軸か？
                ticks: {
                  maxTicksLimit: 10,
                  min: 0,
                },
              },
            ],
          },
        },
      });

      let ctxPred = document.getElementById("prediction");
      new Chart(ctxPred, {
        type: "bar",
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          title: {
            display: true,
            text: "将来の財政状況",
          },
          legend: {
            onClick: function (e, legendItem) {
              //凡例がクリックされたら同ラベルのデータの表示/非表示も切り替えられるようにデフォルトのイベントハンドラーを修正
              let targetLabel = legendItem.text;
              let ci = this.chart;
              let datasets = ci.data.datasets;
              datasets.forEach((value, index) => {
                if (value["label"] === targetLabel) {
                  let meta = ci.getDatasetMeta(index);
                  meta.hidden =
                    meta.hidden === null
                      ? !ci.data.datasets[index].hidden
                      : null;
                }
              });
              ci.update();
            },
            display: true,
            labels: {
              filter: (items, chartData) => {
                //すでに出てきたlegendは表示しないフィルター
                let index = items.datasetIndex;
                let dataBeforeIndex = chartData.datasets.slice(0, index);
                let frag = dataBeforeIndex.some((itemsOfList) => {
                  return itemsOfList["label"] === items["text"];
                });
                return frag !== true;
              },
            },
          },
          responsive: true,
          scales: {
            xAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: "推移年度",
                },
                ticks: {
                  maxTicksLimit: 10,
                },
              },
            ],
            yAxes: [
              {
                id: "y-axis-1", // Y軸のID
                scaleLabel: {
                  display: true,
                  labelString: "（百万円）",
                },
                type: "linear", // linear固定
                position: "left", // どちら側に表示される軸か？
                ticks: {
                  maxTicksLimit: 10,
                  min: Math.min(this.minOfArray(this.pred.V), 0),
                },
              },
            ],
          },
        },
      });
    },
  },
});
