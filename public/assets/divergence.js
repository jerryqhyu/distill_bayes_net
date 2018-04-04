function divergence(div, ruler_div, mean, sd) {

	var divergence_curve_plotter = new Plotter(div, param.divergence_curve_domain_x, param.divergence_curve_domain_y, false, false);

	var ruler_plotter = new Plotter(ruler_div, [0, 1], [0, 100], false, true);
	ruler_plotter.add_group("val");
	ruler_plotter.plot_axis([0, 100], 10);

	divergence_curve_plotter.add_group("divergence");
	divergence_curve_plotter.add_group("variable");
	divergence_curve_plotter.add_group("fixed");
	divergence_curve_plotter.add_group("val");

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
        function gaussianPdf(x, mu, sigma) {
            return (1 / (sigma * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(x - mu, 2) / (2 * (sigma * sigma))));
        }

		var data = {};
		var variable = [];
		var fixed = [];
		var divergence = [];
		var state = radio_button_state();
		var kl = [];
		var reversekl = [];
		var js = [];
        // parameters for the p distribution (a mixture of two gaussians)
        var mus = [-2.0, 3.0];
        var sigmas = [0.5, 1.25];
        var pis = [0.6, 0.4];  // mixture coeffs; must sum to one
		for (var i = -13; i < 13; i += step_size) {
			v = gaussianPdf(i, state_mean, state_sd);

            f = pis[0]*gaussianPdf(i, mus[0], sigmas[0]) + pis[1]*gaussianPdf(i, mus[1], sigmas[1])
//			f = ((1 / (1.3 * Math.sqrt(Math.PI * 2))) * Math.exp(-(Math.pow(i + 3, 2) /
//				(2 * (1.0 * 1.0)))) + (1 / (0.4 * Math.sqrt(Math.PI * 2))) * Math.exp(-(
//				Math.pow(i - 1.5, 2) / (2 * (0.4 * 0.4)))) + (1 / (2 * Math.sqrt(Math.PI *
//				2))) * Math.exp(-(Math.pow(i, 2) / (2 * (4))))) / 3;  // this is where the p distribution is definied
			if (state === "KL") {
				m = f * (Math.log(f) - Math.log(v));
			} else if (state === "reverse KL") {
				m = v * (Math.log(v) - Math.log(f))
			} else if (state === "JS") {
				midpoint = (v + f) / 2
				m = v * (Math.log(v) - Math.log(midpoint)) + 0.5 * f * (Math.log(f) - Math.log(
					midpoint))
			} else {
				m = 0;
			}
			if (isNaN(m)) {
				m = 0;
			}

			variable.push({
				x: i,
				y: v
			});
			fixed.push({
				x: i,
				y: f
			});
			divergence.push({
				x: i,
				y: m
			})
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
		divergence_curve_plotter.plot_path([data.variable], {
			color: "darkred",
			width: 2,
			opacity: 0.5,
			transition: 10,
			id: "#variable"
		});
		divergence_curve_plotter.plot_path([data.fixed], {
			color: "black",
			width: 2,
			opacity: 0.5,
			transition: 10,
			id: "#fixed"
		});
		var negsum = 0;
		for (var i = 0; i < data.divergence.length; i++) {
			negsum -= data.divergence[i].y;
		}
		console.log(data.divergence[260]);
		divergence_curve_plotter.plot_path([data.divergence], {
			color: "darkgrey",
			width: 0,
			opacity: 1,
			fill: divergence_fill_color(negsum),
			transition: 10,
			id: "#divergence"
		});
		var size_scale = d3.scaleLinear().domain([-50, 10]).range([100, 0]);
		size_scale.clamp(true);
		var ruler_line = Array.from(Array(Math.floor(size_scale(negsum))).keys()).map((x, i) => {
			return {x: 0.5, y:i};
		});
		ruler_plotter.plot_path([ruler_line], {
            color: divergence_fill_color(negsum),
			width: ruler_plotter.width,
            opacity: 1,
			id: '#val'
        });
	}

	function redraw_line(mean, sd) {
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

	return {
		getMean: getMean,
		getSd: getSd,
		draw_line: draw_line,
		update: redraw_line
	};
}
