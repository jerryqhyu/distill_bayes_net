var w = 984
var h = 300
var xScale = d3.scaleLinear().domain([-10,10]).range([0,w])
var yScale = d3.scaleLinear().domain([-0.15,0.5]).range([h,0])
var lineVariable = d3.line()
        .x(function(d) {
            return xScale(d.x);
        })
        .y(function(d) {
            return yScale(d.y);
        })
var lineFixed = d3.line()
        .x(function(d) {
            return xScale(d.x);
        })
        .y(function(d) {
            return yScale(d.y);
        })
var lineDiscrepancy = d3.line()
        .x(function(d) {
            return xScale(d.x);
        })
        .y(function(d) {
            return yScale(d.y);
        })

function GaussianCurve(mean, sd, div) {

    var state_mean = mean;
    var state_sd = sd;
    var step_size = 0.1;
    var div = div;
    var intDiv = div.style("width", w + "px")
      .style("height", h + "px")

    div.selectAll("svg").data([0]).enter().append("svg");
    var svg = div.selectAll("svg").data([0]);

    svg.attr("width", w)
       .attr("height", h)

    function getMean (){
        return state_mean;
    }

    function getSd (){
        return state_sd;
    }

    function getGaussianFunctionPoints() {
        var data = {};
        var variable = [];
        var fixed = [];
        var discrepancy = [];
        for (var i = -50; i < 50; i+=step_size) {
            v = (1/(state_sd*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i-state_mean,2)/ (2*(state_sd*state_sd))));
            f = ((1/(1.3*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i+2,2)/ (2*(1.3*1.3)))) +
            (1/(0.4*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i-1.5,2)/ (2*(0.4*0.4)))) +
            (1/(2*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i,2)/ (2*(4))))) / 3;
            d = v * Math.log(v/f)
            if (isNaN(d)) {
                d = 0;
            }
            variable.push({x:i,y:v});
            fixed.push({x:i,y:f});
            discrepancy.push({x:i,y:d});
        }

        data.variable = variable;
        data.fixed = fixed;
        data.discrepancy = discrepancy;
        console.log(data);
        return data;
    }

    function drawLine() {
        data = getGaussianFunctionPoints()
        console.log(data);
        svg.append('path')
                .attr('d', lineVariable(data.variable))
                .attr('stroke', "black")
                .attr('stroke-width', 1)
                .attr('fill', "none")
        svg.append('path')
                .attr('d', lineFixed(data.fixed))
                .attr('stroke', "black")
                .attr('stroke-width', 1)
                .attr('fill', "none")
        svg.append('path')
                .attr('d', lineDiscrepancy(data.discrepancy))
                .attr('stroke', "red")
                .attr('stroke-width', 1)
                .attr('fill', "red")
                .attr('opacity', 0.4)
        console.log("WTF");
    }

    function redrawLine(mean, sd) {
        svg.selectAll("*").remove();

        updateMean(mean);
        updateSd(sd);

        data = getGaussianFunctionPoints()
        svg.append('path')
                .attr('d', lineVariable(data.variable))
                .attr('stroke', "black")
                .attr('stroke-width', 1)
                .attr('fill', "none")
        svg.append('path')
                .attr('d', lineFixed(data.fixed))
                .attr('stroke', "black")
                .attr('stroke-width', 1)
                .attr('fill', "none")
        svg.append('path')
                .attr('d', lineDiscrepancy(data.discrepancy))
                .attr('stroke', "red")
                .attr('stroke-width', 1)
                .attr('fill', "red")
                .attr('opacity', 0.4)
        console.log("WTF2");
    }

    function updateMean(new_mean) {
        state_mean = new_mean;
    }

    function updateSd(new_sd) {
        state_sd = new_sd;
    }

    return {
        getMean: getMean,
        getSd: getSd,
        drawLine: drawLine,
        update: redrawLine,
    };
}
