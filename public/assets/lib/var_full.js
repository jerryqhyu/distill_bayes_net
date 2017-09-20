function var_full(div) {

    //svg properties
    var w = 684
    var h = 300
    var w_2 = 300
    var h_2 = 300

    //scale for diagram on the left
    var x_scale_left = d3.scaleLinear().domain([-5,5]).range([0,w])
    var y_scale_left = d3.scaleLinear().domain([-2,2]).range([h,0])

    //scale for diagram on the right
    var x_scale_right = d3.scaleLinear().domain([-3,3]).range([0,w_2])
    var y_scale_right = d3.scaleLinear().domain([-3,3]).range([h,0])

    var x_scale_right_inverse = d3.scaleLinear().domain([0, w_2]).range([-3,3])
    var y_scale_right_inverse = d3.scaleLinear().domain([h,0]).range([-3,3])

    var line_true = d3.line()
    .x(function(d) {
        return x_scale_left(d.x);
    })
    .y(function(d) {
        return y_scale_left(d.y);
    })
    var line_predicted = d3.line()
    .x(function(d) {
        return x_scale_left(d.x);
    })
    .y(function(d) {
        return y_scale_left(d.y);
    })

    //hard coded points for consistentcy
    var train_points = [ 0.98348382,  0.33239784, -1.9390813 , -1.77390395,  1.31901198,
       -0.55732958, -1.33424016, -2.49962207];
    var validation_points = [0.0074539 , -2.25649362,  1.2912101 ,         -1.15521679,  0.15278725,
        2.0997623 ,  1.47247248, -1.05303993,  0.4568989 , -0.61385536,
       -2.18751186,  1.26085173, -2.8500024 ,  2.59464658,  2.64281159,
       -2.93701525,  0.7578316 ,  2.49371189,  2.43455803, -1.30204828,
       -0.72566079, -2.53146956,  2.37625046, -1.46966588, -1.83330212,
        2.57031247, -1.91009532, -2.41233259, -0.44398402,  1.06769911,
        2.32972244, -1.84966642,  2.53616255,  0.42077324,  0.4261107 ,
        1.42198161,  2.72728906, -1.71100897, -1.59204741,  1.2299973 ,
        0.37747723,  0.32106662,  0.07131672,  0.03220256, -1.37330352,
        1.47470907,  2.19194335, -0.77412576, -1.29907828, -2.64114398];

    var noise_train = [ 0.17785805, -0.08573558,  0.25208923,  0.10656975,  0.1274808 ,
       -0.12225689, -0.50733901,  0.46974662];
    var noise_validation = [-0.09674867,  0.02199221,  0.14537768, -0.11992788,  0.09587188,
        0.04348861,  0.26443214, -0.04382649, -0.02890301, -0.00131674,
        0.09219836,  0.05413551,  0.10605215,  0.03032372,  0.04228423,
        0.07250382,  0.01140705, -0.01311484,  0.04177916, -0.10178443,
       -0.21569761,  0.01565909, -0.27418905, -0.03551064,  0.02892201,
        0.05344915, -0.05026234,  0.18413039, -0.11663553,  0.0162466 ,
       -0.16556253, -0.04830382,  0.24141434,  0.09317031,  0.00835115,
        0.11408831,  0.10949991, -0.03641678, -0.14478094,  0.0234874 ,
       -0.07348802,  0.14804239, -0.23464277,  0.01217727,  0.00439172,
       -0.20313738,  0.09017244,  0.08452561,  0.0044375 ,  0.09312328];

    //hard coded optimum value
    var opt_layer1_w = [[-1.0276857057669717], [-1.7757753110479435]];
    var opt_layer1_b = [-1.0317105484166582, 0.09081335728546522];

    var opt_layer3_w = [[1.2047772931715652, -1.3292389012713663], [-0.8752885769889244, -0.3830013401185536], [-1.2476346720191573, 0.012281561628161724], [-0.48731459666000143, -0.05925733427442881]];
    var opt_layer3_b = [0.049221981161746975, 0.09792876163247693, -0.05580702822640939, 0.0036955128227096567];

    var opt_layer5_w = [[-1.5367545945148897, -0.1830772240247671, 0.6853785345021879, 0.4033122857048783], [0.4878422620322261, 0.36812150154407264, 0.15516684172708473, 0.18484860754255478], [0.8096580125676833, 0.5863946870203293, -0.7670870269665644, -0.3087198804516357], [-0.014253148845799209, 0.6209013272682813, 0.9782959272390246, 0.5111253617093041]];
    var opt_layer5_b = [0.06231072382489856, 0.1929808569792583, 0.027909301916879438, -0.16462008757398824];

    var opt_layer7_w = [[-1.251840378581919, 0.3987561941194795, 0.4857798343153475, 0.9750512501490752]];
    var opt_layer7_b = [0.5047341018322941];

    //define a neural network 3*3
    var net = make_preset_net();
    var epoch = 0;

    var trainer = new convnetjs.Trainer(net, {method: 'sgd', learning_rate: 0.001,
    l2_decay: 0, momentum: 0.9, batch_size: 8,
    l1_decay: 0});

    //diagram parameters
    var step_size = 0.1;
    var div = div;
    var intDiv = div.style("width", w+w_2 + "px")
    .style("height", h + "px")
    var svg = div.append("svg");
    var svg2 = div.append("svg");
    svg.attr("width", w)
    .attr("height", h);
    svg2.attr("width", w_2)
    .attr("height", h_2);

    // plot_contour();

    //interval controller
    var currently_training = 0;
    var was_training = 0;

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
        layer_defs.push({type:'variational', num_neurons:2, activation:'tanh'});
        layer_defs.push({type:'variational', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'variational', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'regression', num_neurons:1});
        var new_net = new convnetjs.Net();
        new_net.makeLayers(layer_defs);
        // new_net.getLayer(1).setWeights(opt_layer1_w);
        // new_net.getLayer(3).setWeights(opt_layer3_w);
        // new_net.getLayer(5).setWeights(opt_layer5_w);
        // new_net.getLayer(7).setWeights(opt_layer7_w);
        // new_net.getLayer(1).setBiases(opt_layer1_b);
        // new_net.getLayer(3).setBiases(opt_layer3_b);
        // new_net.getLayer(5).setBiases(opt_layer5_b);
        // new_net.getLayer(7).setBiases(opt_layer7_b);
        return new_net;
    }

    function reset() {
        net = make_preset_net();
        trainer = new convnetjs.Trainer(net, {method: 'sgd', learning_rate: 0.001,
        l2_decay: 0, momentum: 0.9, batch_size: 8,
        l1_decay: 0});
        clear();
        plot();
        pause_training();
        epoch = 0;
    }

    function train() {
        if (!currently_training) {
            console.log("started training");
            // net.freezeAllButX(1);
            currently_training = setInterval(train_epoch, 50);
        }
    }

    function train_epoch() {
        var x;
        for (var j = 0; j < train_points.length; j++) {
            x = new convnetjs.Vol([train_points[j]]);
            trainer.train(x, [Math.sin(train_points[j])+noise_train[j]]);
        }
        if (epoch === 5000) {
            for (var i = 0; i < net.layers.length; i++) {
                layer = net.getLayer(i);
                if (layer.filters) {
                    console.log("This is layer" + i);
                    console.log("Biases");
                    console.log(layer.biases.w);
                    for (var j = 0; j < layer.filters.length; j++) {
                        console.log(layer.filters[j].w);
                    }
                }
            }
        }

        clear();
        plot();
        epoch++;
    }

    function pause_training() {
        if (currently_training) {
            clearInterval(currently_training);
            currently_training = 0;
        }
    }

    function plot() {
        plot_line();
        // plot_weight();
    }

    function plot_line() {
        data = get_points();
        //sine curve
        svg.append('path')
        .attr('d', line_true(data.real))
        .attr('stroke', "black")
        .attr('stroke-width', 2)
        .attr('fill', "none");

        //NN prediction
        svg.append('path')
        .attr('d', line_predicted(data.pred))
        .attr('stroke', "darkorange")
        .attr('stroke-width', 2)
        .attr('fill', "none")
        .attr('opacity', 0.9);

        //training data points
        for (var j = 0; j < train_points.length; j++) {
            svg.append("circle")
            .attr("cx", x_scale_left(train_points[j]))
            .attr("cy", y_scale_left(Math.sin(train_points[j])+noise_train[j]))
            .attr("r", 3)
            .attr("fill", "red")
            .attr("opacity", 0.7);
        }

        //validation data points
        for (var k = 0; k < validation_points.length; k++) {
            svg.append("circle")
            .attr("cx", x_scale_left(validation_points[k]))
            .attr("cy", y_scale_left(Math.sin(validation_points[k])+noise_validation[k]))
            .attr("r", 3)
            .attr("fill", "teal")
            .attr("opacity", 0.5);
        }
    }

    function get_points() {
        var data = {};
        var real = [];
        var pred = [];
        var predicted_value;
        var x_val;
        for (var i = -20; i < 20; i+=step_size) {
            real.push({x:i,y:Math.sin(i)});
            x_val = new convnetjs.Vol([i]);
            predicted_value = net.forward(x_val);
            pred.push({x:i,y:predicted_value.w[0]});
        }
        data.real = real;
        data.pred = pred;
        return data;
    }

    function plot_weight() {
        weights = get_first_two_weights();
        svg2.append("circle")
        .attr("cx", x_scale_right(weights[0]))
        .attr("cy", y_scale_right(weights[1]))
        .attr("r", 5)
        .attr("fill", "black")
        .attr("opacity", 1)
        .call(d3.drag()
            .on("start", start_drag)
            .on("drag", dragged)
            .on("end", end_drag));
    }

    function get_first_two_weights() {
        return [net.getLayer(1).filters[0].w, net.getLayer(1).filters[1].w];
    }

    function clear() {
        svg.selectAll("*").remove();
        svg2.selectAll("circle").remove();
    }

    function plot_contour() {
        var dummy_net = make_preset_net();
        var n = 300;
        var m = 300;
        var values = new Array(n * m);

        var max = 0;
        var min = 10;
        for (var w_2 = 0, k = 0; w_2 < 300; w_2++) {
            for (var w_1 = 0; w_1 < 300; w_1++, k++) {
                values[k] = compute_validation_loss(dummy_net, x_scale_right_inverse(w_1), -x_scale_right_inverse(w_2));
                if (values[k] > max) {
                    max = values[k];
                }
                if (values[k] < min) {
                    min = values[k];
                }
            }
        }
        console.log(max);
        console.log(min);

        console.log(k);

        var color = d3.scaleLog()
            .domain([0.05,500])
            .interpolate(function() { return d3.interpolateSpectral; });

        var contours = d3.contours()
            .size([n, m])
            .thresholds(d3.range(0.05, 500, 5));

        svg2.selectAll("path")
            .data(contours(values))
            .enter().append("path")
            .attr("d", d3.geoPath(d3.geoIdentity().scale(1)))
            .attr("fill", function(d) { return color(d.value); });
    }

    function compute_validation_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]]);
        for (var j = 0; j < validation_points.length; j++) {
            x_val = new convnetjs.Vol([validation_points[j]]);
            true_label = Math.sin(validation_points[j]) + noise_validation[j];
            predicted = dummy_net.forward(x_val).w[0];
            total_loss += (true_label - predicted) * (true_label - predicted);
        }
        return total_loss;
    }

    function compute_training_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]]);
        for (var i = 0; i < train_points.length; i++) {
            x_val = new convnetjs.Vol([train_points[i]]);
            true_label = Math.sin(train_points[i]) + noise_train[i];
            predicted = dummy_net.forward(x_val).w[0];
            total_loss += (true_label - predicted) * (true_label - predicted);
        }
        return total_loss * validation_points.length / train_points.length;
    }

    function start_drag(d) {
        d3.select(this).raise().classed("active", true);
        if (currently_training) {
            was_training = 1;
        } else {
            was_training = 0;
        }
        pause_training();
    }

    function dragged(d) {
        var new_x = d3.event.x;
        var new_y = d3.event.y;
        d3.select(this).attr("cx", new_x).attr("cy", new_y);
        net.getLayer(1).setWeights([[x_scale_right_inverse(new_x)], [y_scale_right_inverse(new_y)]]);
        clear();
        plot();
        console.log(d3.event.x);
    }

    function end_drag(d) {
        d3.select(this).raise().classed("active", false);
        if (was_training) {
            train();
        }
    }

    return {
        train: train,
        plot: plot,
        reset: reset
    };
}
