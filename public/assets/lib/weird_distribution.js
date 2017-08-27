var w = 984
var h = 300
var xScale = d3.scaleLinear().domain([-10,10]).range([0,w])
var yScale = d3.scaleLinear().domain([-0.05,0.5]).range([h,0])
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
function WeirdCurve(div) {

    var step_size = 0.1;
    var div = div;
    var intDiv = div.style("width", w + "px")
      .style("height", h + "px")

    div.selectAll("svg").data([0]).enter().append("svg");
    var svg = div.selectAll("svg").data([0]);

    svg.attr("width", w)
       .attr("height", h)

    function getWeirdFunctionPoints() {
        var data, variable, fixed, discrepancy = [];
        for (var i = -50; i < 50; i+=step_size) {
            v = (1/(state_sd*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i-state_mean,2)/ (2*(state_sd*state_sd))));
            f = ((1/(1.3*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i+2,2)/ (2*(1.3*1.3)))) +
            (1/(0.4*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i-1.5,2)/ (2*(0.4*0.4)))) +
            (1/(2*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(i,2)/ (2*(4))))) / 3;
            d = f * (Math.log(f) - Math.log(v))
            variable.push({x:i,y:v});
            fixed.push({x:i,y:f});
            discrepancy.push({x:i,y:d});
        }
        console.log(data);
        data.push(variable);
        data.push(fixed);
        data.push(discrepancy);
        return data;
    }

    function drawLine() {
        data = getWeirdFunctionPoints()
        svg.append('path')
                .attr('d', lineVariable(data.variable))
                .attr('stroke', "black")
                .attr('stroke-width', 3)
                .attr('fill', "white")
        svg.append('path')
                .attr('d', lineFixed(data.fixed))
                .attr('stroke', "black")
                .attr('stroke-width', 3)
                .attr('fill', "white")
        svg.append('path')
                .attr('d', lineFixed(data.discrepancy))
                .attr('stroke', "black")
                .attr('stroke-width', 3)
                .attr('fill', "white")
        console.log("WTF");
    }

    function redrawLine(mean, sd) {
        svg.selectAll("*").remove();

        updateMean(mean);
        updateSd(sd);

        data = getWeirdFunctionPoints()
        svg.append('path')
                .attr('d', lineVariable(data.variable))
                .attr('stroke', "black")
                .attr('stroke-width', 3)
                .attr('fill', "white")
        svg.append('path')
                .attr('d', lineFixed(data.fixed))
                .attr('stroke', "black")
                .attr('stroke-width', 3)
                .attr('fill', "white")
        svg.append('path')
                .attr('d', lineFixed(data.discrepancy))
                .attr('stroke', "black")
                .attr('stroke-width', 3)
                .attr('fill', "white")
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
