function divergence(div, mean, sd) {

    var svg = div.append("svg").attr("width", param.w).attr("height", param.h);
    var divergence_curve_plotter = Plotter(svg, param.divergence_curve_domain_x, param.divergence_curve_domain_y, param.w, param.h);

    var state_mean = mean;
    var state_sd = sd;
    var step_size = param.step_size;
    var div = div;

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
        var divergence = [];
        var state = radio_button_state();
        var kl = [];
        var reversekl = [];
        var js = [];
        for (var i = -13; i < 13; i += step_size) {
            v = (1 / (state_sd * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i - state_mean, 2) / (2 * (state_sd * state_sd))));
            f = ((1 / (1.3 * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i + 2, 2) / (2 * (1.3 * 1.3)))) + (1 / (0.4 * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i - 1.5, 2) / (2 * (0.4 * 0.4)))) + (1 / (2 * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i, 2) / (2 * (4))))) / 3;
            if (state === "KL") {
                m = f * (Math.log(f) - Math.log(v));
            } else if (state === "reverse KL") {
                m = v * (Math.log(v) - Math.log(f))
            } else if (state === "JS") {
                midpoint = (v + f) / 2
                m = v * (Math.log(v) - Math.log(midpoint)) + 0.5 * f * (Math.log(f) - Math.log(midpoint))
            } else {
                m = 0;
            }
            if (isNaN(m)) {
                m = 0;
            }

            variable.push({x: i, y: v});
            fixed.push({x: i, y: f});
            divergence.push({x: i, y: m})
        }

        data.variable = variable;
        data.fixed = fixed;
        data.divergence = divergence;
        return data;
    }

    function radio_button_state() {
        var radios = document.getElementsByName('divergence_type');
        for (var i = 0, length = radios.length; i < length; i++) {
            if (radios[i].checked) {
                return radios[i].value;
            }
        }
    }

    function draw_line() {
        data = getGaussianFunctionPoints();
        divergence_curve_plotter.plot_line(data.variable, {
            color: "darkred",
            width: 2,
            opacity: 0.5,
        });
        divergence_curve_plotter.plot_line(data.fixed, {
            color: "black",
            width: 2,
            opacity: 0.5,
        });
        var negsum = 0;
        for (var i = 0; i < data.divergence.length; i++) {
            negsum -= data.divergence[i].y;
        }
        divergence_curve_plotter.plot_line(data.divergence, {
            color: "darkgrey",
            width: 0,
            opacity: 0.5,
            fill: divergence_fill_color(negsum),
        });
        var size_scale = d3.scaleLinear().domain([-150, 10]).range([50, 5]);
        size_scale.clamp(true);
        divergence_curve_plotter.plot_points([{x: -9.5, y: 0.25}], {
            stroke: "black",
            size: size_scale(negsum),
            opacity: 1,
            color: divergence_fill_color(negsum),
        });
    }

    function redraw_line(mean, sd) {
        svg.selectAll("*").remove();
        updateMean(mean);
        updateSd(sd);
        draw_line();
    }

    function updateMean(new_mean) {
        state_mean = new_mean;
    }

    function updateSd(new_sd) {
        state_sd = new_sd;
    }

    return {getMean: getMean, getSd: getSd, draw_line: draw_line, update: redraw_line};
}
