function uncertainty(disagree_div, mlp_div, bnn_div) {

    // svg properties
    var svg1 = disagree_div.append("svg");
    var svg2 = mlp_div.append("svg");
    var svg3 = bnn_div.append("svg");
    svg1.attr("width", param.w).attr("height", param.h);
    svg2.attr("width", param.w_uncertain + 20).attr("height", param.h_uncertain + 20);
    svg3.attr("width", param.w_uncertain + 20).attr("height", param.h_uncertain + 20);

    // plotters
    var disagree_plotter = Plotter(svg1, param.curve_domain_x, param.curve_domain_y, param.w, param.h);
    var mlp_plotter = Plotter(svg2, param.uncertain_domain_x, param.uncertain_domain_y, param.w_uncertain, param.h_uncertain);
    var bnn_plotter = Plotter(svg3, param.uncertain_domain_x, param.uncertain_domain_y, param.w_uncertain, param.h_uncertain);

    //define a neural network
    var mlp = make_preset_net('mlp');
    console.log(mlp.getLayer(1).filters);
    console.log(mlp.getLayer(3).filters);
    console.log(mlp.getLayer(5).filters);
    console.log(mlp.getLayer(7).filters);
    var bnn = make_preset_net('bnn');
    bnn.getLayer(1).setMeans(param.opt_layer1_m);
    bnn.getLayer(3).setMeans(param.opt_layer3_m);
    bnn.getLayer(5).setMeans(param.opt_layer5_m);
    bnn.getLayer(7).setWeights(param.opt_layer7_m);
    console.log(bnn.getLayer(1).mu);
    console.log(bnn.getLayer(3).mu);
    console.log(bnn.getLayer(5).mu);
    console.log(bnn.getLayer(7).filters);

    var mlp_trainer = new net_lib.Trainer(mlp, {
        method: 'sgd',
        learning_rate: param.learning_rate / 10,
        momentum: param.momentum,
        batch_size: param.batch_size
    });

    var bnn_trainer = new net_lib.Trainer(bnn, {
        method: 'sgd',
        learning_rate: param.learning_rate / 10,
        momentum: param.momentum,
        batch_size: param.batch_size
    });

    //interval controller
    var timer;
    setup();

    function train() {
        if (!timer) {
            console.log("started training (uncertainty)");
            timer = d3.timer(train_epoch, 50);
        }
    }

    function train_epoch() {
        var x;
        for (var j = 0; j < param.uncertain_points.length; j++) {
            x = new net_lib.Vol([param.uncertain_points[j]]);
            mlp_trainer.train(x, [param.uncertain_labels[j]]);
            bnn_trainer.train(x, [param.uncertain_labels[j]]);
        }
        clear();
        plot();
    }

    function setup() {
        disagree_plotter.add_group("fixed");
        mlp_plotter.add_group("fixed");
        bnn_plotter.add_group("fixed");
        disagree_plotter.add_group("float");
        mlp_plotter.add_group("float");
        bnn_plotter.add_group("float");
        bnn.getLayer(1).setBiases([0.922587  ,  0.03994551,  0.56162082, 0.37874806,  0.27763538]);
        mlp_plotter.add_x_axis_label("x");
        bnn_plotter.add_x_axis_label("x");
        bnn_plotter.add_y_axis_label("predicted label");
        plot_line();
        plot_points();
    }

    function make_preset_net(type) {
        layertype = type === 'bnn' ? 'variational' : 'fc';
        var layer_defs = [];
        layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: 1});
        layer_defs.push({type: layertype, num_neurons: 5, activation: 'tanh'});
        layer_defs.push({type: layertype, num_neurons: 5, activation: 'tanh'});
        layer_defs.push({type: layertype, num_neurons: 5, activation: 'tanh'});
        layer_defs.push({type: 'regression', num_neurons: 1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        return new_net;
    }

    function reset() {
        mlp = make_preset_net('mlp');
        bnn = make_preset_net('bnn');
        mlp_trainer = new net_lib.Trainer(mlp, {
            method: 'sgd',
            learning_rate: param.learning_rate / 10,
            momentum: 0,
            batch_size: param.batch_size
        });

        bnn_trainer = new net_lib.Trainer(bnn, {
            method: 'sgd',
            learning_rate: param.learning_rate / 10,
            momentum: 0,
            batch_size: param.batch_size
        });
        clear();
        plot();
        pause_training();
        epoch_count = 0;
    }

    function plot() {
        plot_line();
    }

    function plot_points() {
        pts = [];
        for (var i = 0; i < param.uncertain_points.length; i++) {
            pts.push({x: param.uncertain_points[i], y:param.uncertain_labels[i]});
        }
        mlp_plotter.plot_points(pts, {
            stroke: "black",
            color: "darkorange",
            size: 3,
            opacity: 1,
            id: "#fixed"
        });
        bnn_plotter.plot_points(pts, {
            stroke: "black",
            color: "darkorange",
            size: 3,
            opacity: 1,
            id: "#fixed"
        });
    }

    function plot_line() {
        points = enum_points();
        bnn_pred = variational_prediction(points, bnn);
        mlp_pred = mlp_prediction(points, mlp);
        mlp_plotter.plot_line(mlp_pred, {
            color: "black",
            width: 1,
            opacity: 0.5,
            id: "#float"
        });
        for (var i = 0; i < bnn_pred.length; i++) {
            bnn_plotter.plot_line(bnn_pred[i], {
                color: "black",
                width: 1,
                opacity: 0.5,
                id: "#float"
            });
        }
    }

    function enum_points() {
        var p = [];
        for (var i = -7.5; i <= 7.5; i += param.step_size) {
            p.push(i);
        }
        return p;
    }

    function mlp_prediction(x, net) {
        var predicted_values;
        var x_val;
        var pred = [];
        for (var i = 0; i < x.length; i++) {
            x_val = new net_lib.Vol([x[i]]);
            predicted_value = net.forward(x_val);
            pred.push({x: x[i], y: predicted_value.w[0]});
        }
        return pred;
    }

    function variational_prediction(x, net) {
        var predicted_values;
        var x_val;
        var pred = [];
        for (var i = 0; i < param.seeds_uncertainty.length; i++) {
            pred.push([]);
        }
        for (var i = 0; i < x.length; i++) {
            x_val = new net_lib.Vol([x[i]]);
            predicted_values = net.variationalForward(x_val, param.seeds_uncertainty);
            for (var j = 0; j < param.seeds.length; j++) {
                pred[j].push({x: x[i], y: predicted_values[j].w[0]});
            }
        }
        return pred;
    }

    function pause_training() {
        if (timer) {
            timer.stop();
            timer = undefined;
        }
    }

    function clear() {
        svg1.select("#float").selectAll("*").remove();
        svg2.select("#float").selectAll("*").remove();
        svg3.select("#float").selectAll("*").remove();
    }

    return {train: train, reset: reset};
}
