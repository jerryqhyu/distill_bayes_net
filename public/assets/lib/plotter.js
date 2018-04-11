function Plotter(div, domain_x, domain_y, padded, clamp) {

    // svg properties
    var padding = padded
        ? 20
        : 0;
    var div_dim = div.node().getBoundingClientRect();

	this.width = div_dim.width - padding;
	this.height = div_dim.height - padding;
    this.svg = div.append('svg').attr('width', div_dim.width).attr('height', div_dim.height);
    var step_size = param.step_size;

    // scales from domain/range to width/height of the svg
    var x_scale = d3.scaleLinear().domain(domain_x).range([0, this.width]);
    var y_scale = d3.scaleLinear().domain(domain_y).range([this.height, 0]);
    x_scale.clamp(clamp);
    y_scale.clamp(clamp);

	var px = function(d) {
		return x_scale(d.x);
	}
	var py = function(d) {
		return y_scale(d.y);
	}

    var ix = function(d) {
		return d.x;
	}
	var iy = function(d) {
		return d.y;
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

    this.plot_path = function(data, options) {
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
        var transition = typeof(options.transition) === 'undefined'
            ? 100
            : options.transition;
        var id = typeof(options.id) === 'undefined'
            ? ''
            : options.id;

        var paths;
        if (id) {
            paths = this.svg.select(id).selectAll('path').data(data);
        } else {
            paths = this.svg.selectAll('path').data(data);
        }
		paths.exit().remove();
        paths.enter().append('path').merge(paths).transition().duration(transition).attr('d', line).attr('stroke', color).attr('stroke-width', width).attr('fill', fill).attr('opacity', opacity)
    }

	this.plot_line = function(data, options) {
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
        var transition = typeof(options.transition) === 'undefined'
            ? 100
            : options.transition;
        var id = typeof(options.id) === 'undefined'
            ? ''
            : options.id;

        var lines;
        if (id) {
            lines = this.svg.select(id).selectAll('line').data(data);
        } else {
            lines = this.svg.selectAll('line').data(data);
        }
		lines.exit().remove();
		lines.enter().append('line').merge(lines).transition().duration(transition).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).attr('stroke-width', conn_thickness).attr('stroke', conn_colour);
    }

    this.plot_points = function(data, options) {
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
        var transition = typeof(options.transition) === 'undefined'
            ? 100
            : options.transition;
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
            pts = this.svg.select(id).selectAll('circle').data(data);

        } else {
            pts = this.svg.selectAll('circle').data(data);
        }
		pts.exit().remove();
        pts.enter().append('circle').merge(pts).on('mouseover', mouseover).on('mouseout', mouseout).call(d3.drag().on('start', on_drag).on('drag', dragging).on('end', end_drag)).transition().duration(transition).attr('cx', px).attr('cy', py).attr('r', size).attr('stroke', stroke).attr('fill', color).attr('opacity', opacity);
    }

    this.plot_contour = function(data, options) {
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
            size_multiplier = this.width / n;
            this.svg.select(id).selectAll('path').data(contour_scale(data)).enter().append('path').attr('d', d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr('fill', function(d) {
                return color_scale(-d.value);
            }).attr('opacity', opacity).attr('stroke', stroke);
        } else {
            size_multiplier = this.width / n;
            this.svg.selectAll('path').data(contour_scale(data)).enter().append('path').attr('d', d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr('fill', function(d) {
                return color_scale(-d.value);
            }).attr('opacity', opacity);
        }
    }

	this.plot_axis = function(domain, ticks) {
		var x = d3.scaleLinear().domain(domain).range([this.height - 3, 0]); // format fix on my computer...
		var xAxis = d3.axisRight()
		    .scale(x)
		    .ticks(ticks)
			.tickSize(5)
			.tickPadding(0);
		this.svg.append("g")
		    .attr("class", "x axis")
		    .call(xAxis);
	}

    this.plot_neural_net = function(net) {
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
		this.plot_line(lines_to_plot);
        this.plot_points(points, {
            stroke: 'black',
            color: 'white',
            size: 10,
            opacity: 1,
        });
		this.svg.selectAll("text").remove();
        texts.forEach(t => {
            this.svg.append('text').attr('transform', 'translate(' + t.x + ' ,' + t.y + ')').attr('color', 'black').style('text-anchor', 'middle').style('font-size', 30).attr('opacity', 0.5).text('~');
        });
    }

    this.add_group = function(name) {
        this.svg.append('g').attr('id', name);
    }

    this.add_x_axis_label = function(t) {
        this.svg.append('text').attr('transform', 'translate(' + (
        this.width / 2) + ' ,' + (
        this.height + 15) + ')').style('text-anchor', 'middle').attr('color', 'grey').attr('opacity', 0.3).text(t);
    }

    this.add_y_axis_label = function(t) {
        this.svg.append('text').attr('transform', 'translate(' + (
        this.width + 15) + ',' + (
        this.height / 2) + ')rotate(-90)').style('text-anchor', 'middle').attr('color', 'grey').attr('opacity', 0.3).text(t);
    }
}
