function Plotter(div, domain_x, domain_y, padded, clamp) {

    // svg properties
    var padding = padded
        ? 20
        : 0;
    var div_dim = div.node().getBoundingClientRect();
    var width = div_dim.width - padding;
    var height = div_dim.height - padding;
    var svg = div.append('svg').attr('width', div_dim.width + padding).attr('height', div_dim.height + padding);
    var domain_x = domain_x;
    var domain_y = domain_y;
    var step_size = 0.1;

    // scales from domain/range to width/height of the svg
    var x_scale = d3.scaleLinear().domain(domain_x).range([0, width]);
    var y_scale = d3.scaleLinear().domain(domain_y).range([height, 0]);
    x_scale.clamp(clamp);
    y_scale.clamp(clamp);

	var px = function(d) {
		return x_scale(d.x);
	}
	var py = function(d) {
		return y_scale(d.y);
	}

	var x1 = function(d) {
		return x_scale(d.x1);
	}
	var y1 = function(d) {
		return y_scale(d.y1);
	}
	var x2 = function(d) {
		return x_scale(d.x2);
	}
	var y2 = function(d) {
		return y_scale(d.y2);
	}
	var conn_thickness = function(d) {
		return connection_strength_thickness(d.weight);
	};
	var conn_colour = function(d) {
		return connection_variation_color(d.sigma);
	};

    // a line scale
    var line = d3.line().x(function(d) {
        return x_scale(d.x);
    }).y(function(d) {
        return y_scale(d.y);
    }).curve(d3.curveBasis);

    function plot_path(data, options) {
        var options = options || {};
        var color = typeof(options.color) === 'undefined'
            ? 'black'
            : options.color;
        var fill = typeof(options.fill) === 'undefined'
            ? 'none'
            : options.fill;
        var width = typeof(options.width) === 'undefined'
            ? 1
            : options.width;
        var opacity = typeof(options.opacity) === 'undefined'
            ? 1
            : options.opacity;
        var id = typeof(options.id) === 'undefined'
            ? ''
            : options.id;

        var paths;
        if (id) {
            paths = svg.select(id).selectAll('path').data(data);
        } else {
            paths = svg.selectAll('path').data(data);
        }
		paths.exit().remove();
        paths.enter().append('path').merge(paths).transition().duration(100).attr('d', line).attr('stroke', color).attr('stroke-width', width).attr('fill', fill).attr('opacity', opacity)
    }

	function plot_line(data, options) {
        var options = options || {};
        var color = typeof(options.color) === 'undefined'
            ? 'black'
            : options.color;
        var fill = typeof(options.fill) === 'undefined'
            ? 'none'
            : options.fill;
        var width = typeof(options.width) === 'undefined'
            ? 1
            : options.width;
        var opacity = typeof(options.opacity) === 'undefined'
            ? 1
            : options.opacity;
        var id = typeof(options.id) === 'undefined'
            ? ''
            : options.id;

        var lines;
        if (id) {
            lines = svg.select(id).selectAll('line').data(data);
        } else {
            lines = svg.selectAll('line').data(data);
        }
		lines.exit().remove();
		lines.enter().append('line').merge(lines).transition().duration(100).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).attr('stroke-width', conn_thickness).attr('stroke', conn_colour);
    }

    function plot_points(data, options) {
        // stroke = 'black', color = 'black', size = 3, opacity = 1, on_drag, dragging, end_drag
        var options = options || {};
        var stroke = typeof(options.stroke) === 'undefined'
            ? 'none'
            : options.stroke
        var color = typeof(options.color) === 'undefined'
            ? 'black'
            : options.color
        var size = typeof(options.size) === 'undefined'
            ? 2
            : options.size
        var opacity = typeof(options.opacity) === 'undefined'
            ? 1
            : options.opacity
        var id = typeof(options.id) === 'undefined'
            ? ''
            : options.id
        var on_drag = typeof(options.on_drag) === 'undefined'
            ? undefined
            : options.on_drag
        var dragging = typeof(options.dragging) === 'undefined'
            ? undefined
            : options.dragging
        var end_drag = typeof(options.end_drag) === 'undefined'
            ? undefined
            : options.end_drag
        var mouseover = typeof(options.mouseover) === 'undefined'
            ? undefined
            : options.mouseover
        var mouseout = typeof(options.mouseout) === 'undefined'
            ? undefined
            : options.mouseout

        var pts;
        if (id) {
            pts = svg.select(id).selectAll('circle').data(data);

        } else {
            pts = svg.selectAll('circle').data(data);
        }
		pts.exit().remove();
        pts.enter().append('circle').merge(pts).on('mouseover', mouseover).on('mouseout', mouseout).call(d3.drag().on('start', on_drag).on('drag', dragging).on('end', end_drag)).transition().duration(100).attr('cx', px).attr('cy', py).attr('r', size).attr('stroke', stroke).attr('fill', color).attr('opacity', opacity);
    }

    function plot_contour(data, options) {
        //contour is a marching square, we have to scale the squares to svg size
        // n, m, color_scale, contour_scale, id, opacity, stroke
        var options = options || {};
        var n = typeof(options.n) === 'undefined'
            ? 0
            : options.n
        var m = typeof(options.m) === 'undefined'
            ? 0
            : options.m
        var color_scale = typeof(options.color_scale) === 'undefined'
            ? null
            : options.color_scale
        var contour_scale = typeof(options.contour_scale) === 'undefined'
            ? null
            : options.contour_scale
        var id = typeof(options.id) === 'undefined'
            ? ''
            : options.id
        var opacity = typeof(options.opacity) === 'undefined'
            ? 1
            : options.opacity
        var stroke = typeof(options.stroke) === 'undefined'
            ? 'none'
            : options.stroke

        if (id) {
            size_multiplier = width / n;
            svg.select(id).selectAll('path').data(contour_scale(data)).enter().append('path').attr('d', d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr('fill', function(d) {
                return color_scale(-d.value);
            }).attr('opacity', opacity).attr('stroke', stroke);
        } else {
            size_multiplier = width / n;
            svg.selectAll('path').data(contour_scale(data)).enter().append('path').attr('d', d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr('fill', function(d) {
                return color_scale(-d.value);
            }).attr('opacity', opacity);
        }
    }

    function plot_neural_net(net) {
        var num_layers = net.layers.filter(x => x.layer_type == 'fc' || x.layer_type == 'variational').length;
        var points = [];
        var texts = [];
		var lines_to_plot = [];
        var num_slots = num_layers + 2;
        var last_idx = 0;
        net.layers.forEach((layer, i) => {
            layer_width = layer.out_depth;
            if (layer.layer_type === 'fc') {
                layer.filters.forEach((column, j) => {
                    points.push({
                        x: (last_idx + 1) / num_slots,
                        y: (j + 1) / (layer_width + 1)
                    });
                    column.w.forEach((weight, k) => {
						lines_to_plot.push({x1: last_idx / num_slots, y1: (k + 1) / (layer.num_inputs + 1), x2: (last_idx + 1) / num_slots, y2: (j + 1) / (layer_width + 1), weight: weight, sigma: 0});
                    });
                });
                last_idx++;
            } else if (layer.layer_type === 'variational') {
                layer.mu.forEach((column, j) => {
                    points.push({
                        x: (last_idx + 1) / num_slots,
                        y: (j + 1) / (layer_width + 1)
                    });
                    column.w.forEach((weight, k) => {
                        lines_to_plot.push({x1: last_idx / num_slots, y1:(k + 1) / (layer.num_inputs + 1), x2: (last_idx + 1) / num_slots, y2: (j + 1) / (layer_width + 1), weight: weight, sigma: layer.sigma[j].w[k]});
                    });
                });
                last_idx++;
            } else if (layer.layer_type === 'tanh' || layer.layer_type === 'rbf') {
                for (var j = 0; j < layer_width; j++) {
                    // 0.02 is an adjustment to make it look better
                    texts.push({
                        x: x_scale((last_idx) / num_slots),
                        y: y_scale((j + 1) / (layer_width + 1) - 0.04)
                    });
                }
            } else if (layer.layer_type === 'input') {
                for (var j = 0; j < layer_width; j++) {
                    points.push({
                        x: (last_idx + 1) / num_slots,
                        y: (j + 1) / (layer_width + 1)
                    });
                }
                last_idx++;
            }
        });

        plot_points(points, {
            stroke: 'black',
            color: 'white',
            size: 10,
            opacity: 1,
        });

		plot_line(lines_to_plot);

		svg.selectAll("text").remove();
        texts.forEach(t => {
            svg.append('text').attr('transform', 'translate(' + t.x + ' ,' + t.y + ')').attr('color', 'black').style('text-anchor', 'middle').style('font-size', 30).attr('opacity', 0.5).text('~');
        });
    }

    function add_group(name) {
        svg.append('g').attr('id', name);
    }

    function add_x_axis_label(t) {
        svg.append('text').attr('transform', 'translate(' + (
        width / 2) + ' ,' + (
        height + 15) + ')').style('text-anchor', 'middle').attr('color', 'grey').attr('opacity', 0.3).text(t);
    }

    function add_y_axis_label(t) {
        svg.append('text').attr('transform', 'translate(' + (
        width + 15) + ',' + (
        height / 2) + ')rotate(-90)').style('text-anchor', 'middle').attr('color', 'grey').attr('opacity', 0.3).text(t);
    }

    return {
        svg: svg,
        plot_path: plot_path,
        plot_points: plot_points,
        plot_contour: plot_contour,
        plot_neural_net: plot_neural_net,
        add_group: add_group,
        add_x_axis_label: add_x_axis_label,
        add_y_axis_label: add_y_axis_label
    };
}
