function nn_full(div) {

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
    var y_scale_right = d3.scaleLinear().domain([-2,2]).range([h,0])

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
    var train_points = [-2.9, -2.7, -2.5, -2.3, -2.1, -1.9, -1.7, -1.5, -1.3, -1.1, -0.9, -0.7, -0.5, -0.3, -0.1, 0.1,
        0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9];
    var noise = [ 0.10408689,  0.10999347, -0.21092732,  0.21040211, -0.05441124,
        0.32326489, -0.25552701, -0.47457946,  0.02745911,  0.10275629,
        0.22240206,  0.52373514,  0.18365871,  0.07530947, -0.29227835,
        0.18867107,  0.52420313,  0.04456809, -0.24384817,  0.40080137,
        0.26032293,  0.05870727, -0.02125257, -0.12151286, -0.02832058,
        0.03619698, -0.00548018, -0.18057678,  0.23171462,  0.31800257];

    //hard coded optimum value
    var opt_layer1_w = [[0.4192284525818726], [-4.632616835554741], [3.9243368339649196], [3.007595350590139]];
    var opt_layer1_b = [0.7387670254211024, 2.7824153174038213, 0.2444733033082039, 0.501684733161062];
    var opt_layer3_w = [[-2.116031388782301, -0.2678318154538704, -0.32568638911346537, -0.48299422168750644], [0.9719684653689481, -2.915204139102752, 2.389421278369706, 0.7084161317375112], [1.361639935467432, 0.4988850894321718, -0.746099613716224, -0.6611748808451762], [-0.3633784464695688, -4.356958010471985, 0.33555515720941714, 1.7905782720048318]];
    var opt_layer3_b = [0.11184642289580203, -0.8811859534301382, 0.08163456672122071, -0.3890155005638783];
    var opt_layer5_w = [[1.1441634172101276, -0.7957053928418958, -3.741088356272393, -1.0003872580823125], [3.43546769606019, -0.5556880998853753, -0.587307130090077, 0.34996873441168774]];
    var opt_layer5_b = [0.8820188720910388, -0.0033133460236606177];
    var opt_layer7_w = [[1.3540954016648952, -0.9209768713048309]];
    var opt_layer7_b = [0.08352788520153473];

    //define a neural network 3*3
    var layer_defs = [];
    var epoch = 0;
    layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
    layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
    layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
    layer_defs.push({type:'fc', num_neurons:2, activation:'tanh'});
    layer_defs.push({type:'regression', num_neurons:1});
    var net = new convnetjs.Net();
    net.makeLayers(layer_defs);
    var trainer = new convnetjs.Trainer(net, {method: 'adadelta', batch_size: 10});
    //set all parameters
    net.getLayer(1).setWeights(opt_layer1_w);
    net.getLayer(3).setWeights(opt_layer3_w);
    net.getLayer(5).setWeights(opt_layer5_w);

    net.getLayer(1).setBiases(opt_layer1_b);
    net.getLayer(3).setBiases(opt_layer3_b);
    net.getLayer(5).setBiases(opt_layer5_b);
    net.getLayer(7).setBiases(opt_layer7_b);

    // var trainer = new convnetjs.Trainer(net, {method: 'sgd', learning_rate: 0.05,
    // l2_decay: 0, momentum: 0.9, batch_size: 50,
    // l1_decay: 0});

    //diagram parameters
    var step_size = 0.1;
    var div = div;
    var intDiv = div.style("width", w+w_2 + "px")
    .style("height", h + "px")
    var svg = div.append("svg");
    var svg2 = div.append("svg");
    // var svg = div.selectAll("svg").data([0]);
    // var svg2 = div.selectAll("svg").data([1]);
    svg.attr("width", w)
    .attr("height", h);
    svg2.attr("width", w_2)
    .attr("height", h_2);

    //interval controller
    var interval_id = -1;

    function get_points() {
        var data = {};
        var real = [];
        var pred = [];
        var predicted_value;
        var x_val;
        for (var i = -20; i < 20; i+=step_size) {
            real.push({x:i,y:Math.sin(i)});
            x_val = new convnetjs.Vol([i]);
            var predicted_value = net.forward(x_val);
            pred.push({x:i,y:predicted_value.w[0]});
        }
        data.real = real;
        data.pred = pred;
        return data;
    }

    function get_last_two_weights() {
        return net.getLayer(7).filters[0].w;
    }

    function draw_line() {
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
            .attr("cy", y_scale_left(Math.sin(train_points[j])+noise[j]))
            .attr("r", 3)
            .attr("fill", "red")
            .attr("opacity", 0.7);
        }
    }

    function draw_weight() {
        weights = get_last_two_weights();
        svg2.append("circle")
        .attr("cx", x_scale_right(weights[0]))
        .attr("cy", y_scale_right(weights[1]))
        .attr("r", 5)
        .attr("fill", "black")
        .attr("opacity", 1);
    }

    function clear() {
        svg.selectAll("*").remove();
        svg2.selectAll("*").remove();
    }

    function draw() {
        draw_line();
        draw_weight();
    }

    function train() {
        if (interval_id == -1) {
            console.log("started training");
            net.freezeAllButLast();
            interval_id = setInterval(train_epoch, 10);
        }
    }

    function train_epoch() {
        var x;
        for (var j = 0; j < train_points.length; j++) {
            x = new convnetjs.Vol([train_points[j]]);
            trainer.train(x, [Math.sin(train_points[j])+noise[j]]);
        }
        // if (epoch === 5000) {
        //     for (var i = 0; i < net.layers.length; i++) {
        //         layer = net.getLayer(i);
        //         if (layer.filters) {
        //             console.log("This is layer" + i);
        //             console.log("Biases");
        //             console.log(layer.biases.w);
        //             for (var j = 0; j < layer.filters.length; j++) {
        //                 console.log(layer.filters[j].w);
        //             }
        //         }
        //     }
        // }

        clear();
        draw();
        epoch++;
    }

    function reset() {
        layer_defs = [];
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:2, activation:'tanh'});
        layer_defs.push({type:'regression', num_neurons:1});
        net = new convnetjs.Net();
        net.makeLayers(layer_defs);
        net.getLayer(1).setWeights(opt_layer1_w);
        net.getLayer(3).setWeights(opt_layer3_w);
        net.getLayer(5).setWeights(opt_layer5_w);
        // net.getLayer(7).setWeights(opt_layer7_w);
        net.getLayer(1).setBiases(opt_layer1_b);
        net.getLayer(3).setBiases(opt_layer3_b);
        net.getLayer(5).setBiases(opt_layer5_b);
        net.getLayer(7).setBiases(opt_layer7_b);

        trainer = new convnetjs.Trainer(net, {method: 'adadelta', batch_size: 10});
        clear();
        draw();
        if (interval_id != -1) {
            clearInterval(interval_id);
            interval_id = -1;
        }
        epoch = 0;
    }

    return {
        train: train,
        draw: draw,
        reset: reset
    };
}
