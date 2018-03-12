function full_bnn_view(curve_div, graph_div) {

	var curve_plotter = Plotter(curve_div, param.curve_domain_x, param.curve_domain_y,
		false, false);
	var graph_plotter = Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

	//define a neural network
	var epoch_count = 0;
	var net = make_preset_net();
	var samples = sample_from_seed("Toronto", 30, 255);


	var trainer = new net_lib.Trainer(net, {
		method: 'sgd',
		learning_rate: param.learning_rate * 2,
		momentum: 0.95,
		batch_size: param.validation_points.length,
	});

	//interval controller
	var timer;
	setup();

	function train() {
		if (!timer) {
			console.log("started training");
			timer = d3.timer(train_epoch, 50);
		}
	}

	function train_epoch() {
		var x;
		for (var j = 0; j < param.validation_points.length; j++) {
			x = new net_lib.Vol([param.validation_points[j]]);
			trainer.train(x, [Math.sin(param.validation_points[j]) + param.validation_noise[j]]);
		}
		clear();
		plot();
		epoch_count++;
	}

	function setup() {
		curve_plotter.add_group("fixed");
		curve_plotter.add_group("float");
		graph_plotter.add_group("fixed");
		graph_plotter.add_group("float");
		initial_plot();
	}

	function make_preset_net() {
		var layer_defs = [];
		layer_defs.push({
			type: 'input',
			out_sx: 1,
			out_sy: 1,
			out_depth: 1
		});
		layer_defs.push({
			type: 'variational',
			num_neurons: 15,
			activation: 'rbf'
		});
		layer_defs.push({
			type: 'variational',
			num_neurons: 15,
			activation: 'rbf'
		});
		layer_defs.push({
			type: 'vregression',
			num_neurons: 1
		});
		var new_net = new net_lib.Net();
		new_net.makeLayers(layer_defs);
		return new_net;
	}

	function reset() {
		net = make_preset_net();
		trainer = new net_lib.Trainer(net, {
			method: 'sgd',
			learning_rate: param.learning_rate * 2,
			momentum: 0.95,
			batch_size: param.validation_points.length,
		});
		clear();
		plot();
		pause_training();
		epoch_count = 0;
	}

	function plot() {
		plot_line();
		graph_plotter.plot_neural_net(net, "#float");
	}

	function plot_line() {
		var curve_x = [];
		for (var i = -5; i <= 5; i += param.step_size / 3) {
			curve_x.push(i);
		}
		var curve = variational_prediction(curve_x);
		for (var i = 0; i < samples.length; i++) {
			curve_plotter.plot_line(curve[i], {
				color: "darkorange",
				width: 1,
				opacity: 0.5,
				id: "#float"
			});
		}
	}

	function pause_training() {
		if (timer) {
			timer.stop();
			timer = undefined;
		}
	}

	function clear() {
		curve_plotter.svg.select("#float").selectAll("*").remove();
		graph_plotter.svg.select("#float").selectAll("*").remove();
	}

	function initial_plot() {
		plot_train_and_valid_points();
		plot();
	}

	function plot_train_and_valid_points() {
		//individual training and validation points
		training_points_data = [];
		//training data points
		for (var i = 0; i < param.validation_points.length; i++) {
			training_points_data.push({
				x: param.validation_points[i],
				y: Math.sin(param.validation_points[i]) + param.validation_noise[i]
			});
		}
		validation_points_data = [];
		//training data points
		for (var i = 0; i < param.validation_points.length; i++) {
			validation_points_data.push({
				x: param.validation_points[i],
				y: Math.sin(param.validation_points[i]) + param.validation_noise[i]
			});
		}
		curve_plotter.plot_points(validation_points_data, {
			stroke: "black",
			color: "black",
			size: 3,
			opacity: 0.5,
			id: "#fixed"
		});
	}

	function variational_prediction(x) {
		var predicted_values;
		var x_val;
		var pred = [];
		for (var i = 0; i < samples.length; i++) {
			pred.push([]);
		}
		for (var i = 0; i < x.length; i++) {
			x_val = new net_lib.Vol([x[i]]);
			predicted_values = net.variationalForward(x_val, samples);
			for (var j = 0; j < samples.length; j++) {
				pred[j].push({
					x: x[i],
					y: predicted_values[j].w[0]
				});
			}
		}
		return pred;
	}

	return {
		train: train,
		plot: plot,
		reset: reset
	};
}
