function svi(curve_div, train_loss_div, valid_loss_div, progress_div, graph_div) {

    var curve_plotter = Plotter(curve_div, param.curve_domain_x, param.curve_domain_y, false, false);
    var train_loss_plotter = Plotter(train_loss_div, param.loss_domain_x, param.loss_domain_y, true, true);
    var valid_loss_plotter = Plotter(valid_loss_div, param.loss_domain_x, param.loss_domain_y, true, true);
    var progress_plotter = Plotter(progress_div, param.progress_domain_x, param.progress_domain_y, false, true);
    var graph_plotter = Plotter(graph_div, [
        0, 1
    ], [
        0, 1
    ], false, false);

    this.num_samples = 10;
    var var_dist_data = new Array(param.var_n * param.var_m);
    var avg_loss = [];
    var samples = sample_from_seed("Toronto", this.num_samples, 2);
    var last_10_samples = [];
    var isocontours = new Array(5);
    for (var i = 0; i < 5; i++) {
        isocontours[i] = new Array(Math.floor((Math.PI * 2 + param.step_size) / param.step_size + 1));
    }

    //define a neural network
    var epoch_count = 0;
    var net = make_preset_net();

    var trainer = new net_lib.Trainer(net, {
        method: 'sgd',
        learning_rate: param.learning_rate,
        momentum: param.momentum,
        batch_size: param.batch_size,
        l2_decay: param.l2_decay
    });

    //interval controller
    var training_interval;
    var plot_interval;
    setup();

    function train() {
        if (!training_interval) {
            console.log("started training");
            net.freezeAllButLayer(1);
            net.getLayer(1).freeze_biases();
            training_interval = d3.timer(train_epoch, 50);
            plot_interval = d3.timer(plot, 1000);
        }
    }

    function train_epoch() {
        var x;
        for (var j = 0; j < param.train_points.length; j++) {
            x = new net_lib.Vol([param.train_points[j]]);
            trainer.train(x, [Math.sin(param.train_points[j]) + param.train_noise[j]]);
        }
        epoch_count++;
    }

    function setup() {
        curve_plotter.add_group("training_point");
        curve_plotter.add_group("validation_point");
        train_loss_plotter.add_group("contour");
        valid_loss_plotter.add_group("contour");
        progress_plotter.add_group("fixed");

        curve_plotter.add_group("curve");
        train_loss_plotter.add_group("distribution");
        valid_loss_plotter.add_group("distribution");
        curve_plotter.add_group("float");
        train_loss_plotter.add_group("mean");
        valid_loss_plotter.add_group("mean");
        progress_plotter.add_group("float");

        graph_plotter.add_group("float");
        train_loss_plotter.add_group("pts");
        valid_loss_plotter.add_group("pts");

        train_loss_plotter.add_x_axis_label("w1");
        train_loss_plotter.add_y_axis_label("w2");
        valid_loss_plotter.add_x_axis_label("w1");
        valid_loss_plotter.add_y_axis_label("w2");
        initial_plot();
    }

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: 1});
        layer_defs.push({type: 'variational', num_neurons: 2, activation: 'tanh', alpha: 1e-2});
        layer_defs.push({type: 'fc', num_neurons: 4, activation: 'tanh', alpha: 1e-2});
        layer_defs.push({type: 'fc', num_neurons: 4, activation: 'tanh', alpha: 1e-2});
        layer_defs.push({type: 'regression', num_neurons: 1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);

        // set the params for later layers
        new_net.getLayer(1).setMeans([[2], [2]]);
        new_net.getLayer(3).setWeights(param.opt_layer3_w);
        new_net.getLayer(5).setWeights(param.opt_layer5_w);
        new_net.getLayer(7).setWeights(param.opt_layer7_w);
        new_net.getLayer(1).setBiases(param.opt_layer1_b);
        new_net.getLayer(3).setBiases(param.opt_layer3_b);
        new_net.getLayer(5).setBiases(param.opt_layer5_b);
        new_net.getLayer(7).setBiases(param.opt_layer7_b);
        return new_net;
    }

	function stop() {
		pause_training();
	}

    function reset() {
        net = make_preset_net();
        trainer = new net_lib.Trainer(net, {
            method: 'sgd',
            learning_rate: param.learning_rate,
            momentum: param.momentum,
            batch_size: param.batch_size
        });
        avg_loss = [];
		last_10_samples = [];
        plot();
        pause_training();
        epoch_count = 0;
    }

    function plot() {
        // plot_avg();
        plot_path();
        plot_variational_distribution();
        plot_weight();
        graph_plotter.plot_neural_net(net, "#float");
    }

    function plot_path() {
		var curve = variational_prediction(curve_x, samples);
		curve_plotter.plot_path(curve, {
			color: "darkorange",
			width: 1,
			opacity: 0.5,
			id: "#curve",
		});
	}

    function plot_weight() {
        var mean = [
            net.getLayer(1).mu[0].w[0],
            net.getLayer(1).mu[1].w[0]
        ];
        train_loss_plotter.plot_points([
            {
                x: mean[0],
                y: mean[1]
            }
        ], {
            stroke: "black",
            color: "black",
            size: 4,
            opacity: 0.75,
            id: "#mean"
        });
        valid_loss_plotter.plot_points([
            {
                x: mean[0],
                y: mean[1]
            }
        ], {
            stroke: "black",
            color: "black",
            size: 4,
            opacity: 0.75,
            id: "#mean"
        });
        if (last_10_samples.length === 10) {
            last_10_samples.shift();
        }
        last_10_samples.push({x: net.getLayer(1).sampled_w[0].w[0], y: net.getLayer(1).sampled_w[1].w[0]});
        train_loss_plotter.plot_points(last_10_samples, {
            stroke: "black",
            color: "darkgreen",
            size: 4,
            opacity: 0.5,
            id: "#pts"
        });
        valid_loss_plotter.plot_points(last_10_samples, {
            stroke: "black",
            color: "darkgreen",
            size: 4,
            opacity: 0.5,
            id: "#pts"
        });
    }

    function sample_weight() {
        var s = [
            net_lib.randn(0, 0),
            net_lib.randn(0, 0),
            net_lib.randn(0, -2)
        ];
        param.seeds.push(s);
        plot();
    }

    function pause_training() {
        if (training_interval) {
            training_interval.stop();
            training_interval = undefined;
        }
    }

    function plot_variational_distribution() {
        var mean = [
            net.getLayer(1).mu[0].w[0],
            net.getLayer(1).mu[1].w[0]
        ];
        var std = [
            net.getLayer(1).sigma[0].w[0],
            net.getLayer(1).sigma[1].w[0]
        ];
        for (var i = 0; i < 5; i++) {
            for (var t = 0, n = 0; t <= Math.PI * 2 + param.step_size; t += param.step_size, n++) {
                isocontours[i][n] = {
                    x: mean[0] + i * std[0] * Math.cos(t),
                    y: mean[1] + i * std[1] * Math.sin(t)
                };
            }
        }

        train_loss_plotter.plot_path(isocontours, {
            color: "black",
            fill: "white",
            width: 1,
            opacity: 1 / 6,
            id: "#distribution"
        });
        valid_loss_plotter.plot_path(isocontours, {
            color: "black",
            fill: "white",
            width: 1,
            opacity: 1 / 6,
            id: "#distribution"
        });
    }

    function initial_plot() {
        plot_contours();
        plot_MLE();
        plot_train_and_valid_points();
        plot();
    }

    function plot_contours() {
        var train_contour_data = new Array(param.n * param.m);
        var valid_contour_data = new Array(param.n * param.m);
        var dummy_net = make_preset_net();
        for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
            for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
                train_contour_data[k] = compute_training_loss(dummy_net, inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor))
                valid_contour_data[k] = compute_validation_loss(dummy_net, inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor));
            }
        }
        plot_contour(train_loss_plotter, train_contour_data, train_contour_color, train_contour_scale);
        plot_contour(valid_loss_plotter, valid_contour_data, valid_contour_color, valid_contour_scale);
    }

    function plot_train_and_valid_points() {
        training_points_data = param.train_points.map((p, i) => {
            return {
                x: p,
                y: Math.sin(p) + param.train_noise[i]
            };
        });
        validation_points_data = param.validation_points.map((p, i) => {
            return {
                x: p,
                y: Math.sin(p) + param.validation_noise[i]
            };
        });
        curve_plotter.plot_points(training_points_data, {
            stroke: "red",
            color: "red",
            size: 3,
            opacity: 1,
            id: "#training_point"
        });
        curve_plotter.plot_points(validation_points_data, {
            stroke: "green",
            color: "green",
            size: 3,
            opacity: 0.5,
            id: "#validation_point"
        });
    }

    function plot_MLE() {
        MLE = [];
        for (var i = 0; i < 1; i += param.step_size) {
            MLE.push({x: i, y: 2.7963}); //MLE validation loss
        }
        progress_plotter.plot_path([MLE], {
            color: "darkgreen",
            width: 2,
            opacity: 0.5,
            id: "#curve"
        });
    }

    function plot_avg(curve, valid) {
        var avg_valid = compute_avg_prediction(valid);
        avg_loss.push(get_test_loss_from_prediction(avg_valid));

        var avg_loss_data = [];
        for (var i = 0; i < avg_loss.length; i++) {
            avg_loss_data.push({
                x: (i + 1) / (avg_loss.length + 1),
                y: avg_loss[i]
            });
        }
        progress_plotter.plot_path([avg_loss_data], {
            color: "black",
            width: 3,
            opacity: 1,
            id: "#float"
        });
    }

    function compute_avg_prediction(pred) {
        var avg_pred = [];
        for (var i = 0; i < pred[0].length; i++) {
            avg = 0;
            for (var j = 0; j < pred.length; j++) {
                avg += pred[j][i].y / pred.length;
            }
            avg_pred.push({x: pred[0][i].x,
                y: avg
            });
        }
        return avg_pred;
    }

    function plot_contour(plotter, data, color, contours) {
        plotter.plot_contour(data, {
            n: param.n,
            m: param.m,
            color_scale: color,
            contour_scale: contours,
            id: "#contour"
        });
    }

    function compute_validation_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setMeans([[w_1], [w_2]]);
        for (var j = 0; j < param.validation_points.length; j++) {
            x_val = new net_lib.Vol([param.validation_points[j]]);
            true_label = Math.sin(param.validation_points[j]) + param.validation_noise[j];
            total_loss += dummy_net.getCostLoss(x_val, true_label);
        }
        return total_loss;
    }

    function compute_training_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setMeans([[w_1], [w_2]]);
        for (var i = 0; i < param.train_points.length; i++) {
            x_val = new net_lib.Vol([param.train_points[i]]);
            true_label = Math.sin(param.train_points[i]) + param.train_noise[i];
            total_loss += dummy_net.getCostLoss(x_val, true_label);
        }
        return total_loss;
    }

    function variational_prediction(x, seeds) {
        var predicted_values;
        var x_val;
        var pred = new Array(seeds.length);
        for (var i = 0; i < seeds.length; i++) {
            pred[i] = new Array(x.length);
        }
        for (var i = 0; i < x.length; i++) {
            x_val = new net_lib.Vol([x[i]]);
            predicted_values = net.variationalForward(x_val, seeds);
            for (var j = 0; j < seeds.length; j++) {
                pred[j][i] = {x: x[i], y: predicted_values[j].w[0]};
            }
        }
        return pred;
    }

    function get_test_loss_from_prediction(avg_prediction) {
        var total_loss = 0;
        var predicted;
        var true_label;
        for (var j = 0; j < param.validation_points.length; j++) {
            true_label = Math.sin(param.validation_points[j]) + param.validation_noise[j];
            total_loss += 0.5 * (true_label - avg_prediction[j].y) * (true_label - avg_prediction[j].y);
        }
        return total_loss;
    }

    function on_drag(d) {
        d3.select(this).raise().classed("active", true);
        pause_training();
    }

    function dragging(d) {
        var new_x = d3.event.x;
        var new_y = d3.event.y;
        d3.select(this).attr("cx", new_x).attr("cy", new_y);
        net.getLayer(1).setMeans([
            [inv_x_scale(new_x)],
            [inv_y_scale(new_y)]
        ]);
        plot();
        console.log(d3.event.x);
    }

    function end_drag(d) {
        d3.select(this).raise().classed("active", false);
    }

    function mouseover() {
        d3.select(this).attr("r", 10);
    }

    function mouseout() {
        d3.select(this).attr("r", 5);
    }

    return {train: train, plot: plot, reset: reset, stop: stop};
}
