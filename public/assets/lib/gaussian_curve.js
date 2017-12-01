function GaussianCurve(mean, sd, div) {

    var w = 984
    var h = 300
    var xScale = d3.scaleLinear().domain([-12, 12]).range([0, w])
    var yScale = d3.scaleLinear().domain([-0.15, 0.5]).range([h, 0])
    var lineVariable = d3.line().x(function(d) {
        return xScale(d.x);
    }).y(function(d) {
        return yScale(d.y);
    })
    var lineFixed = d3.line().x(function(d) {
        return xScale(d.x);
    }).y(function(d) {
        return yScale(d.y);
    })
    var lineKL = d3.line().x(function(d) {
        return xScale(d.x);
    }).y(function(d) {
        return yScale(d.y);
    })
    var lineJS = d3.line().x(function(d) {
        return xScale(d.x);
    }).y(function(d) {
        return yScale(d.y);
    })

    var state_mean = mean;
    var state_sd = sd;
    var step_size = 0.1;
    var div = div;
    var intDiv = div.style("width", w + "px").style("height", h + "px")

    div.selectAll("svg").data([0]).enter().append("svg");
    var svg = div.selectAll("svg").data([0]);

    svg.attr("width", w).attr("height", h)

    function getMean() {
        return state_mean;
    }

    function getSd() {
        return state_sd;
    }

    function getGaussianFunctionPoints() {
        var data = {};
        var variable = [];
        var fixed = [];
        var kl = [];
        var reversekl = [];
        var js = [];
        for (var i = -13; i < 13; i += step_size) {
            v = (1 / (state_sd * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i - state_mean, 2) / (2 * (state_sd * state_sd))));
            f = ((1 / (1.3 * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i + 2, 2) / (2 * (1.3 * 1.3)))) + (1 / (0.4 * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i - 1.5, 2) / (2 * (0.4 * 0.4)))) + (1 / (2 * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i, 2) / (2 * (4))))) / 3;

            // this is reverse KL(q||p)
            rd = v * (Math.log(v) - Math.log(f))
            // this is KL(p||q)
            d = f * (Math.log(f) - Math.log(v))

            //this is Jensen Shannon divergence
            midpoint = (v + f) / 2
            j = 0.5 * v * (Math.log(v) - Math.log(midpoint)) + 0.5 * f * (Math.log(f) - Math.log(midpoint))

            if (isNaN(rd)) {
                rd = 0;
            }

            if (isNaN(d)) {
                d = 0;
            }

            if (isNaN(j)) {
                j = 0;
            }
            variable.push({x: i, y: v});
            fixed.push({x: i, y: f});
            reversekl.push({x: i, y: rd});
            kl.push({x: i, y: d});
            js.push({x: i, y: j});
        }

        data.variable = variable;
        data.fixed = fixed;
        data.kl = kl;
        data.reversekl = reversekl;
        data.js = js;
        return data;
    }

    function drawLine() {
        data = getGaussianFunctionPoints()
        svg.append('path').attr('d', lineVariable(data.variable)).attr('stroke', "black").attr('stroke-width', 1).attr('fill', "none")
        svg.append('path').attr('d', lineFixed(data.fixed)).attr('stroke', "black").attr('stroke-width', 1).attr('fill', "none")
        svg.append('path').attr('d', lineKL(data.kl)).attr('stroke', "darkgreen").attr('stroke-width', 1).attr('fill', "darkgreen").attr('opacity', 0.35)
        svg.append('path').attr('d', lineKL(data.reversekl)).attr('stroke', "darkred").attr('stroke-width', 1).attr('fill', "darkred").attr('opacity', 0.35)
        svg.append('path').attr('d', lineJS(data.js)).attr('stroke', "darkorange").attr('stroke-width', 1).attr('fill', "darkorange").attr('opacity', 0.35)
    }

    function redrawLine(mean, sd) {
        svg.selectAll("*").remove();
        updateMean(mean);
        updateSd(sd);

        data = getGaussianFunctionPoints()
        svg.append('path').attr('d', lineVariable(data.variable)).attr('stroke', "black").attr('stroke-width', 1).attr('fill', "none")
        svg.append('path').attr('d', lineFixed(data.fixed)).attr('stroke', "black").attr('stroke-width', 1).attr('fill', "none")
        svg.append('path').attr('d', lineKL(data.kl)).attr('stroke', "darkgreen").attr('stroke-width', 1).attr('fill', "darkgreen").attr('opacity', 0.35)
        svg.append('path').attr('d', lineKL(data.reversekl)).attr('stroke', "darkred").attr('stroke-width', 1).attr('fill', "darkred").attr('opacity', 0.35)
        svg.append('path').attr('d', lineJS(data.js)).attr('stroke', "darkorange").attr('stroke-width', 1).attr('fill', "darkorange").attr('opacity', 0.35)
    }

    function updateMean(new_mean) {
        state_mean = new_mean;
    }

    function updateSd(new_sd) {
        state_sd = new_sd;
    }

    return {getMean: getMean, getSd: getSd, drawLine: drawLine, update: redrawLine};
}
