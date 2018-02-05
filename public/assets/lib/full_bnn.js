function full_bnn_view(div) {

    // + 20 is hotfix for axis labels
    var svg = div.append("svg");
    svg.attr("width", 1960).attr("height", 500);

    // plotters
    var curve_plotter = Plotter(svg, param.curve_domain_x, param.curve_domain_y, 1960, 500);

    var avg_loss = [];

    //define a neural network
    var obtaining_param = true;
    var epoch_count = 0;
    var net = make_preset_net();

    var trainer = new net_lib.Trainer(net, {
        method: 'sgd',
        learning_rate: param.learning_rate * 2,
        momentum: 0,
        batch_size: 64
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
        for (var j = 0; j < param.train_points.length; j++) {
            x = new net_lib.Vol([param.train_points[j]]);
            trainer.train(x, [Math.sin(param.train_points[j]) + param.train_noise[j]]);
        }
        if (obtaining_param) {
            for (var j = 0; j < param.validation_points.length * 2; j++) {
                x = new net_lib.Vol([param.validation_points[j % param.validation_points.length]]);
                trainer.train(x, [Math.sin(param.validation_points[j % param.validation_points.length]) + param.validation_noise[j % param.validation_points.length]]);
            }
        }
        clear();
        plot();
        epoch_count++;
    }

    function setup() {
        curve_plotter.add_group("fixed");
        curve_plotter.add_group("float");
        initial_plot();
    }

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: 1});
        layer_defs.push({type: 'variational', num_neurons: 2, activation: 'tanh'});
        layer_defs.push({type: 'variational', num_neurons: 4, activation: 'tanh'});
        layer_defs.push({type: 'variational', num_neurons: 4, activation: 'tanh'});
        layer_defs.push({type: 'regression', num_neurons: 1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        new_net.getLayer(1).setMeans([[0.2], [0.2]]);
        new_net.getLayer(3).setMeans(param.opt_layer3_m.copyWithin());
        new_net.getLayer(5).setMeans(param.opt_layer5_m.copyWithin());
        new_net.getLayer(7).setWeights(param.opt_layer7_m.copyWithin());
        new_net.getLayer(1).setBiases(param.opt_layer1_vb.copyWithin());
        new_net.getLayer(3).setBiases(param.opt_layer3_vb.copyWithin());
        new_net.getLayer(5).setBiases(param.opt_layer5_vb.copyWithin());
        new_net.getLayer(7).setBiases(param.opt_layer7_vb.copyWithin());
        return new_net;
    }

    function reset() {
        net = make_preset_net();
        trainer = new net_lib.Trainer(net, {
            method: 'sgd',
            learning_rate: param.learning_rate * 2,
            momentum: 0,
            batch_size: 64
        });
        avg_loss = [];
        clear();
        plot();
        pause_training();
        epoch_count = 0;
    }

    function plot() {
        plot_line();
        plot_variational_distribution();
    }

    function plot_line() {
        var curve_x = [];
        for (var i = -5; i <= 5; i += param.step_size/5) {
            curve_x.push(i);
        }
        var curve = variational_prediction(curve_x);
        for (var i = 0; i < param.seeds_uncertainty.length; i++) {
            curve_plotter.plot_line(curve[i], {
                color: "orange",
                width: 1,
                opacity: 0.5,
                id: "#float"
            });
        }
        mean = [];
        for (var i = -5; i <= 5; i += param.step_size) {
            x_val = new net_lib.Vol([i]);
            predicted_value = net.forward(x_val);
            mean.push({x: i, y: predicted_value.w[0]});
        }
        curve_plotter.plot_line(mean, {
            color: "red",
            width: 2,
            id: "#float"
        });
    }

    function sample_weight() {

    }

    function pause_training() {
        if (timer) {
            timer.stop();
            timer = undefined;
        }
    }

    function plot_variational_distribution() {

    }

    function clear() {
        svg.select("#float").selectAll("*").remove();
    }

    function initial_plot() {
        plot_train_and_valid_points();
        plot();
    }

    function plot_train_and_valid_points() {
        //individual training and validation points
        training_points_data = [];
        //training data points
        for (var i = 0; i < param.train_points.length; i++) {
            training_points_data.push({
                x: param.train_points[i],
                y: Math.sin(param.train_points[i]) + param.train_noise[i]
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
        curve_plotter.plot_points(training_points_data, {
            stroke: "red",
            color: "red",
            size: 3,
            opacity: 1,
            id: "#fixed"
        });
        curve_plotter.plot_points(validation_points_data, {
            stroke: "green",
            color: "green",
            size: 3,
            opacity: 0.5,
            id: "#fixed"
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

    function variational_prediction(x) {
        var predicted_values;
        var x_val;
        var pred = [];
        for (var i = 0; i < param.seeds_uncertainty.length; i++) {
            pred.push([]);
        }
        for (var i = 0; i < x.length; i++) {
            x_val = new net_lib.Vol([x[i]]);
            predicted_values = net.variationalForward(x_val, param.seeds_uncertainty);
            for (var j = 0; j < param.seeds_uncertainty.length; j++) {
                pred[j].push({x: x[i], y: predicted_values[j].w[0]});
            }
        }
        return pred;
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
        clear();
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

    return {train: train, plot: plot, reset: reset, sample: sample_weight};
}
