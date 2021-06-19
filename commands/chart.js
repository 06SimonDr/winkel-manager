const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { MessageAttachment } = require("discord.js");
const timeSchema = require("../models/time")

const width = 800;
const height = 600;

module.exports = {
  name: "chart",
  description: "Chart!",
  minArgs: 0,
  usage: "",
  ownerOnly: true,
  async execute(client, message, args, prefix) {

    const dagen = [-7, -6, -5, -4, -3, -2, -1, 0]
var testList = []
var list2 = []

for (const dag of dagen) {
  var getal = 0
  var test = getDay(dag)
  const results = await timeSchema.find({ day: test })
  for (const result of results) {
    var test2 = parseInt(result.duration)
    getal += test2/3600000
  }
  testList.push(test)
  list2.push(getal)
}

    const canvas = new ChartJSNodeCanvas({width: 800, height: 600})

    const plugin = {
      id: 'custom_canvas_background_color',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#383838';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    };

    const configuration = {
      type: "line",
      data: {
        labels: testList,
        datasets: [
          {
            label: "Aantal uren gewerkt",
            data: list2,
            backgroundColor: "#6fc4e3",
            borderColor: '#067478',
            fill: true
          },
        ],
      },
      plugins: [plugin],
      options: {
        plugins: {
          legend: {
            labels: {
              color: "white",
              font: {
                size: 18
              }
            }
          }
        },
        title: {
          display: true,
          text: 'Winkel activiteit'
        },
      }
    };

    const image = await canvas.renderToBuffer(configuration);

    const attachment = new MessageAttachment(image);

    message.channel.send(attachment);
  },
};

function getDay(day){
    var today = new Date();
    var targetday_milliseconds=today.getTime() + 1000*60*60*24*day;          
    today.setTime(targetday_milliseconds);
    var tYear = today.getFullYear();  
    var tMonth = today.getMonth();  
    var tDate = today.getDate();  
    tMonth = doHandleMonth(tMonth + 1);  
    tDate = doHandleMonth(tDate);  
    return tDate+"-"+tMonth+"-"+tYear;  
}
function doHandleMonth(month){
    var m = month;  
    if(month.toString().length == 1){  
       m = "0" + month;  
    }  
    return m;  
}