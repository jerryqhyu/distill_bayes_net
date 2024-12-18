function full_bnn_view(curve_div, graph_div) {

	this.div_id = curve_div.attr('id');

	this.start = function() {
        if (!training_interval) {
            console.log("started training");
			training_interval = d3.timer(train_epoch, 50);
            plot_interval = d3.timer(plot, 200);
        }
    }

	this.stop = function() {
        if (training_interval) {
            training_interval.stop();
			plot_interval.stop();
            training_interval = undefined;
			plot_interval = undefined;
        }
    }

	this.is_running = function () {
		return training_interval != null;
	}

	this.reset = function() {
	    samples = sample_from_seed("Toronto", 10, 144);
        net = make_preset_net();
        trainer = new net_lib.Trainer(net, {
            learning_rate: param.learning_rate * 2,
            batch_size: param.validation_points.length * 2
        });
        plot();
        this.stop();
        epoch_count = 0;
    }

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.curve_domain_y, false, false);
    var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

    //define a neural network
    var epoch_count = 0;
    var net = make_preset_net();
    var samples = sample_from_seed("Toronto", 10, 144);

    var trainer = new net_lib.Trainer(net, {
        learning_rate: param.learning_rate * 2,
        batch_size: param.validation_points.length * 2
    });

    //interval controller
	var training_interval;
    var plot_interval;
    setup();

    function train_epoch() {
        var x;
        for (var j = 0; j < param.validation_points.length; j++) {
            x = new net_lib.Vol([param.validation_points[j]]);
            trainer.train(x, [Math.sin(param.validation_points[j]) + param.validation_noise[j]]);
        }
        epoch_count++;
    }

    function setup() {
        curve_plotter.add_group("fixed");
        curve_plotter.add_group("float");
        graph_plotter.add_group("fixed");
        graph_plotter.add_group("float");
		plot_train_and_valid_points();
        plot();
    }

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: 1});
        layer_defs.push({type: 'variational', num_neurons: 8, activation: 'rbf', alpha: 1e-5});
		layer_defs.push({type: 'variational', num_neurons: 8, activation: 'rbf', alpha: 1e-5});
        layer_defs.push({type: 'variational', num_neurons: 8, activation: 'rbf', alpha: 1e-5});
        layer_defs.push({type: 'vregression', num_neurons: 1, alpha:1e-4});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        return new_net;
    }

    function plot() {
        plot_path();
        graph_plotter.plot_neural_net(net, "#float");
    }

    function plot_path() {
        var curve = variational_prediction(curve_x_extended);
        curve_plotter.plot_path(curve, {
            color: "darkorange",
            width: 1,
            opacity: 0.5,
            id: "#float"
        });
    }

    function plot_train_and_valid_points() {
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
        var pred = new Array(samples.length);
        for (var i = 0; i < samples.length; i++) {
            pred[i] = new Array(x.length);
        }
        for (var i = 0; i < x.length; i++) {
            x_val = new net_lib.Vol([x[i]]);
            predicted_values = net.variationalForward(x_val, samples);
            for (var j = 0; j < samples.length; j++) {
                pred[j][i] = {
                    x: x[i],
                    y: predicted_values[j].w[0]
                };
            }
        }
        return pred;
    }
}
