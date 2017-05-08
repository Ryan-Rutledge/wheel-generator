var WG = {
	WHEEL_SIZE: 96,
	MIN_SIZE: 4,
	COLORS: {
		BLACK: '#000',
		GRAY: '#333',
		RED: '#e04c4c',
		WHITE: '#eee',
		GOLD: '#e9d149',
		PURPLE: '#ca6fe6',
		BLUE: '#52bce8',
		DARK_RED: '#de3f3f',
		DARK_WHITE: '#e6e6e6',
		DARK_GOLD: '#e7ce3b',
		DARK_PURPLE: '#c562e4',
		DARK_BLUE: '#44b7e6'
	},
	init: function($form, $display) {
		form = new WG.Form($form);
		wheel = new WG.Wheel($display.find('.figure-wheel'));
		header = new WG.Header($display.find('.figure-header'));
		moveset = new WG.Moveset($display.find('.figure-moveset'));
		display = new WG.Display(form, wheel, header, moveset, $display.find('.figure-display-notification'));
	},
	Display: function(form, wheel, header, moveset, $notification) {
		var self = this;
		self.$notification = $notification;

		moveset.drake.on('drag', function(el) {
			index = $(el).index() - 1;
		});
		
		moveset.drake.on('dragend', function(el) {
			var new_index = $(el).index() - 1;
			form.move(index, new_index);
			index = undefined;
		});

		form.onChange(function(figure) {
			if (figure.error) {
				self.notify(figure.error);
			}
			else {
				self.notify();
				moveset.update.call(moveset, figure);
				header.update.call(header, figure);
				wheel.update(figure);
			}
		});

		form.change(true);
	},
	Header: function($header) {
		var self = this;
		self.$header = $header;
	},
	Moveset: function($moveset) {
		var self = this;
		self.$moveset = $moveset;
		var index;

		self.drake = dragula([$moveset.get(0)], {
			moves: function(el, source) {
				return $(el).is('.figure-move');
			},
			accepts: function(el, target, source, sibling) {
				return $(sibling).is('.figure-move');
			},
			direction: 'vertical',
			ignoreInputTextSelection: true,
			mirrorContainer: $moveset.get(0)
		});
	},
	Form: function($form) {
		var self = this;
		self.$form = $form;
		self.$segments = $form.find('.segments');
		self.changeListeners = [];

		// Handle dropdown selection menus
		$form.find('.dropdown-item-option').click(function() {
			var $this = $(this);
			var $menu = $this.parent().prev();
			$menu.html($this.data('val') === undefined ? $this.text() : $this.data('val'));
			$menu.val($this.val());
		});

		// Handle segment type change
		$form.find('.segment-type').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $menu = $this.parent().prev();
			var $spinMod = $segment.find('[name="segment_spin_modifier"]');
			var $effect = $segment.find('[name="segment_effect"]').parent();
			var $stars = $segment.find('[name="segment_stars"]');
			var $damage = $segment.find('[name="segment_damage"]');
			var $name = $segment.find('[name="segment_name"]');
			var color = $this.val();

			var placeholder = '';

			$segment.css('background-color', WG.COLORS[color]);

			switch (color) {
				case 'RED':
					$spinMod.hide();
					$stars.hide();
					$effect.slideUp();
					$damage.hide();

					placeholder = 'Miss';
					break;
				case 'WHITE':
				case 'GOLD':
					$stars.hide();
					$spinMod.show();
					$effect.show();

					$spinMod.next().children(':first').click();
					$damage.val(10).show();

					if (color === 'GOLD') {
						placeholder = 'Quick Attack';
					}
					else {
						placeholder = 'Scratch';
					}

					break;
				case 'PURPLE':
					$spinMod.hide();
					$stars.show();
					$stars.next().children(':first').click();
					$effect.slideDown();
					$damage.hide();

					placeholder = 'Fly Away';
					break;
				case 'BLUE':
					$stars.hide();
					$spinMod.hide();
					$effect.slideDown();
					$damage.hide();

					placeholder = 'Dodge';
					break;
			}

			$name.attr('placeholder', placeholder);
			if (!$name.val() || $name.val() === 'Miss') {
				$name.val(placeholder);
			}
		});

		// Handle segment spin modifier change
		$form.find('.segment-spin-modifier').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $effect = $segment.find('[name="segment_spin_effect"]').parent();

			if ($this.val()) {
				$effect.slideDown();
			}
			else {
				$effect.slideUp();
			}
		});

		// Handle abliity change
		$form.find('[name="figure_ability"]').focus(function() {
			$('[name="figure_effect"]').parent().slideDown();
		}).blur(function() {
			if (!$(this).val()) {
				$('[name="figure_effect"]').parent().slideUp();
			}
		});

		// Handle segment spin modifier change
		$form.find('[name="segment_damage"]').change(function() {
			var $segment = $(this).closest('.segment');
			var $spinMod = $segment.find('[name="segment_spin_modifier"]').parent();

			if ($(this).val()) {
				$spinMod.show();
			}
			else {
				$segment.find('.segment-spin-modifier').first().click();
				$spinMod.hide();
			}
		});

		// Hide unnecessary content
		$form.find('[name="figure_effect"]').parent().hide();
		$form.find('[name="segment_effect"]').parent().hide();
		$form.find('[name="segment_spin_effect"]').parent().hide();
		$form.find('[name="segment_damage"]').hide();

		// Set default segment type
		$form.find('.segment-type[value="RED"]').click();

		$form
			// Handle segment deletion
			.find('.delete-segment').click(function() {
				$(this).closest('.segment').animate(
					{ opacity: 0, height: 0, padding: 0, margin: 0},
					{ duration: 400, queue: false, complete: function() {
						$(this).remove();
						self.fillMiss();
						self.change.call(self, 'delete');
					} });
			})

			// Handle hover effect
			.hover(function() {
				$(this).closest('.segment').css('opacity', '0.7');
			}, function() {
				$(this).closest('.segment').css('opacity', '');
			});
		
		// Activate dragula
		var drake = dragula([$form.find('.segments').get(0)], {
			direction: 'vertical',
			mirrorContainer: $form.find('.segments').get(0)
		});

		drake.on('dragend', function(el) {
			self.change.call(self, 'move');
		});

		// Handle segment size limits
		$form.find('[name="segment_size"]').focus(function() {
			$(this).attr('max', self.max($(this).closest('.segment')));
		}).change(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');

			$this.val(Math.max(Math.min(self.max($segment), $this.val()), WG.MIN_SIZE));

			self.fillMiss($segment.has('[name="segment_type"][value="RED"]') ? $segment : undefined);
		});

		// Add change event handlers
		$form.find('textarea, input, [name]').change(function() {
			self.change.call(self, 'data');
		});
		$form.find('button').click(function() {
			self.change.call(self, 'data');
		});

		// Create a blank segment template
		self.$segmentClone = $form.find('.segment').clone(true);

		// Handle new segment events
		$form.find('.new-segment').click(function() {
			var $miss = self.$segments.children(':first, :last').has('[name="segment_type"][value="RED"]');

			// Decrease miss size
			var $size = $miss.find('[name="segment_size"]');
			$size.val($size.val() - WG.MIN_SIZE);

			var $newSegment = self.$segmentClone.clone(true).hide();

			// If next to a miss
			if ($miss.get(0)) {
				// Add white segment
				$newSegment.find('.segment-type[value="WHITE"]').click();
			}

			// Add segment
			$form.find('.segments').append($newSegment);

			// Set segment width
			$newSegment.find('[name="segment_size"]').val(WG.MIN_SIZE);

			// animate insertion
			$newSegment.slideDown();
			self.fillMiss();
			self.change.call(self, 'add');
		});

		// Setup default miss
		$form.find('.segment [name="segment_size"]').val(WG.WHEEL_SIZE);
	},
	Wheel: function($wheel) {
		var self = this;
		self.$wheel = $wheel;

		self.paper = new Raphael($wheel.get(0), 400, 400);
		self.paper.setViewBox(-6, -6, 412, 412);
		self.paper.canvas.setAttribute('preserveAspectRatio', 'xMidYMid');
	}
};

WG.Form.prototype.total = function() {
	return this.$form.find('[name="segment_size"]').toArray().reduce(function(a, b) {
		return a + parseInt($(b).val());
	}, 0);
};

WG.Form.prototype.max = function($segment) {
	var $segments = this.$segments.children().not($segment);
	var min_miss = WG.MIN_SIZE * ($segments.has('[name="segment_type"][value="RED"]').length - 1);
	var non_miss = $segments.not(':has([name="segment_type"][value="RED"])')
		.find('[name="segment_size"]').toArray().reduce(function(a, b) {
			return a + parseInt($(b).val());
		}
	, 0);

	return WG.WHEEL_SIZE - WG.MIN_SIZE - (min_miss + non_miss);
};

WG.Form.prototype.generateSegment = function(segment) {
	var $segment = this.$segmentClone.clone(true);

	$segment.find('.segment-type[value="' + segment.type + '"]').click();
	$segment.find('[name="segment_size"]').val(segment.size);
	$segment.find('[name="segment_name"]').val(segment.name);
	$segment.find('[name="segment_effect"]').val(segment.effect)

	switch (segment.type) {
		case 'WHITE':
		case 'GOLD':
			$segment.find('[name="segment_spin_effect"]').val(segment.spinEffect);
			$segment.find('[name="segment_damage"]').val(segment.damage)
			$segment.find('.segment-spin-modifier[value="' + segment.spinMod + '"]').click();
			break;
		case 'PURPLE':
			$segment.find('.segment-stars[value="' + segment.damage + '"]').click()
			break;
	}

	return $segment;
};

WG.Form.prototype.update = function(figure) {
	var self = this;
	self.changeDisabled = true;
	self.$form.find('[name="figure_name"]').val(figure.name);
	self.$form.find('[name="figure_type_1"]').val(figure.type[0]);
	self.$form.find('[name="figure_type_2"]').val(figure.type[1]);
	self.$form.find('[name="figure_mp"]').val(figure.mp);

	if (figure.ability) {
		self.$form.find('[name="figure_ability"]').val(figure.ability);
		self.$form.find('[name="figure_effect"]').val(figure.effect);
		$('[name="figure_effect"]').parent().show();
	}
	else {
		$('[name="figure_effect"]').parent().hide();
	}

	self.$segments.empty();
	figure.segments.forEach(function(segment) {
		self.$segments.append(
			self.generateSegment.call(self, segment)
		);
	});

	self.changeDisabled = false;

	self.change();
};

WG.Form.prototype.extractSegment = function($segment) {
	segment = {};

	segment.name = $segment.find('[name="segment_name"]').val();
	segment.size = $segment.find('[name="segment_size"]').val();
	segment.type = $segment.find('[name="segment_type"]').val();

	if (!segment.name) {
		segment.error = 'Missing name of attack';
		return segment;
	}

	switch (segment.type) {
		case 'WHITE':
		case 'GOLD':
			segment.spinMod = $segment.find('[name="segment_spin_modifier"]').val();
			segment.effect = $segment.find('[name="segment_effect"]').val();
			segment.damage = parseInt($segment.find('[name="segment_damage"]').val());

	 		if (isNaN(segment.damage)) {
				segment.damage = undefined;

				if (!segment.effect) {
					segment.error = 'Missing damage/effect';
					break;
				}
			}
			else if (segment.spinMod) {
				segment.spin = $segment.find('[name="segment_spin_effect"]').val();
				break;
			}

			break;
		case 'PURPLE':
			segment.damage = $segment.find('[name="segment_stars"]').val();
			segment.effect = $segment.find('[name="segment_effect"]').val();
			break;
		case 'BLUE':
			segment.effect = $segment.find('[name="segment_effect"]').val();
			break;
	}
	
	return segment;
};

WG.Form.prototype.extractFigure = function() {
	var self = this;
	var figure = {};
	var total = self.total();

	if (total !== WG.WHEEL_SIZE) {
		return { error: 'Wheel must be exactly ' + WG.WHEEL_SIZE + ', but is currently ' + total + '.' };
	}

	// Check segment divisiblity
	var $sizes = self.$segments.find('[name="segment_size"]');
	for (var i = 0; i < $sizes.length; i++) {
		if ($sizes.eq(i).val() % WG.MIN_SIZE !== 0) {
			return { error: 'Segment sizes must be divisible by ' + WG.MIN_SIZE + '.' };
		}
	}

	var type1 = self.$form.find('[name="figure_type_1"]').val();
	var type2 = self.$form.find('[name="figure_type_2"]').val();

	figure.name    = self.$form.find('[name="figure_name"]').val();
	figure.mp      = self.$form.find('[name="figure_mp"]').val();
	figure.ability = self.$form.find('[name="figure_ability"]').val();
	figure.type    = [];

	if (type1) { figure.type.push(type1); }
	if (type2) { figure.type.push(type2); }

	if (figure.ability) {
		figure.effect = self.$form.find('[name="figure_effect"]').val();
	}

	figure.segments = [];
	var error = false;
	self.$segments.find('.segment').each(function(_, segment) {
		var segment = figure.segments.push(self.extractSegment($(segment)));

		if (segment.error) { error = true; }
	});

	if (error) {
		figure = {
			error: figure.segments.map(function(segment) {
				return segment.error;
			}).join('<br />')
		};
	}

	return figure;
};

WG.Form.prototype.move = function(old_index, new_index) {
	var self = this;
	var $segment = self.$segments.find('.segment').eq(old_index).detach();
	var $next = self.$segments.find('.segment').eq(new_index);
	
	if ($next.get(0)) {
		$next.before($segment);
	}
	else {
		self.$segments.append($segment);
	}

	self.change();
};

WG.Form.prototype.fillMiss = function($exclude) {
	var $missSize = this.$segments.children().has('[name="segment_type"][value="RED"]').find('[name="segment_size"]');

	if ($missSize.length > 1) {
		var $tmp = $missSize.filter(function() {
			return $(this).val() > WG.MIN_SIZE;
		});

		$missSize = $tmp.get(0) ? $tmp : $missSize;
	}

	if ($exclude) {
		$missSize = $missSize.not($exclude.find('[name="segment_size"]'));
	}

	$missSize.last().val(WG.WHEEL_SIZE - (this.total() - $missSize.val()));
};

WG.Form.prototype.handleChange = function() {
	var figure = this.extractFigure();

	var $misses = this.$segments.children().has('[name="segment_type"][value="RED"]');

	var filled = !$misses.filter(function() {
		return $(this).find('[name="segment_size"]').val() > WG.MIN_SIZE;
	}).get(0) && this.total() >= WG.WHEEL_SIZE;

	// Disable button if there is no room left
	this.$form.find('.new-segment').prop('disabled', filled);

	// Apply change handlers
	this.changeListeners.forEach(function(listener) {
		listener(figure);
	});
};

WG.Form.prototype.change = function(now) {
	var self = this;
	if (self.changeDisabled) return;
	if (self.changeTimeout) clearTimeout(self.changeTimeout);

	if (now) {
		self.handleChange(self);
	}
	else {
		self.changeTimeout = setTimeout(function() {
			self.handleChange.call(self);
		}, 500);
	}
};

WG.Form.prototype.onChange = function(callback) {
	this.changeListeners.push(callback);
};

WG.Moveset.prototype.TEMPLATE = $(
	'<tbody class="figure-move">' +
		'<tr>' +
			'<td class="figure-move-size-container text-center"><span class="figure-move-size"></span></td>' +
			'<td class="figure-move-name text-left pl-2"></td>' +
			'<td class="figure-move-damage text-center"></td>' +
		'</tr>' +
		'<tr>' +
			'<td class="figure-move-effect text-left pl-4 pr-4" colspan="3"></td>' +
		'</tr>' +
		'<tr class="figure-move-separator">' +
		'</tr>' +
	'</tbody>'
);

WG.Moveset.prototype.generateMove =  function(segment) {
	var $move = WG.Moveset.prototype.TEMPLATE.clone().addClass(segment.type.toLowerCase() + '-move');

	if (segment.error) {
		$move.find('tr:not(:last)').remove();
		$move.addClass('figure-move-error').prepend(
			$('<tr>').append(
				$('<td class="text-center" rowspan="2" colspan="3">').append(
					$('<em>').text(segment.error)
				)
			)
		);
		return $move;
	}

	var size = segment.size;
	var name = segment.name;
	var damage = '';
	var spin = '';
	var effect = '';
	var classes = '';

	switch (segment.type) {
		case 'WHITE':
		case 'GOLD':
			damage = segment.damage;
			effect = segment.effect;

			if (effect && damage) {
				effect = '*' + effect;
				name += '*';
			}

			if (segment.spinMod) {
				spin = segment.spin;
				damage += segment.spinMod;
			}
			break;
		case 'PURPLE':
			classes = 'star-count star-count-' + segment.damage;
			effect = segment.effect;
			break;
		case 'BLUE':
			effect = segment.effect;
			break;
	}

	$move.find('.figure-move-name').text(name)
	$move.find('.figure-move-damage').text(damage);
	$move.find('.figure-move-size').text(size);
	if (classes) $move.addClass(classes);

	effect = effect.replace(/\[attack\]/g, name);
	spin = spin.replace(/\[attack\]/g, name);

	if (spin || effect) {
		$move.find('.figure-move-effect').text(spin + ' ' + effect);
	}
	else {
		$move.find('.figure-move-effect').parent().remove();
	}

	return $move;
};

WG.Moveset.prototype.generate = function(figure) {
	var self = this;
	var $rows = $('<div>');

	// Add segments
	figure.segments.forEach(function(segment) {
		$rows.append(self.generateMove(segment));
	});

	return $rows.html();
};

WG.Moveset.prototype.update = function(figure) {
	this.$moveset.find('tbody').remove();
	this.$moveset.append(this.generate(figure));
};

WG.Header.prototype.update = function(figure) {
	this.$header.find('.figure-name').text(figure.name || '[Not Provided]');
	this.$header.find('.figure-type').text(figure.type.join(', ') || '[Not Provided]');
	this.$header.find('.figure-ability').text(figure.ability || 'None').show();

	if (figure.ability) {
		this.$header.find('.figure-effect').text(figure.effect).show();
	}
	else {
		this.$header.find('.figure-effect').hide();
	}
};

WG.Display.prototype.notify = function(text) {
	if (text) {
		this.$notification.addClass('d-flex').fadeIn();
		this.$notification.children().text(text);
	}
	else {
		this.$notification.fadeOut(400, function() {
			$(this).removeClass('d-flex');
		});
		this.$notification.children().text('');
	}
}

WG.Wheel.prototype.insertSegmentName = function(br, er, text) {
	var self = this;
	var radius = 175;
	var r = er - br;
	var size = Math.min(radius / 5, (r * radius) / (text.length * 1.5));

	var options = {
		'fill': WG.COLORS.BLACK,
		'font-family': 'monospace',
		'font-size': size,
		'font-weight': 'bold',
		'text-anchor': 'middle',
	}

	var tmp = self.paper.text(0, 0, text).attr(options);
	var letterSize = tmp.getBBox().width / text.length;
	tmp.remove();

	var t = Math.min(r / text.length, (letterSize / radius) * Math.PI);
	t = (letterSize / (radius * 1.5)) * Math.PI;
	var padding = (r - t*text.length) / 2;

	// For each letter
	var cr = er - padding - (t / 2);
	text.split('').forEach(function(c) {
		var cx = 200 + radius * Math.cos(cr);
		var cy = 200 + radius * Math.sin(cr);
		var d = cr * 180 / Math.PI;

		options['transform'] = 'r ' + (d - 90);
		options['transform'] = 'r ' + (d - 90);

		// Add letter
		self.paper.text(cx, cy, c).attr(options);;

		cr -= t;
	});
};

WG.Wheel.prototype.insertSegmentStars = function(br, er, starCount) {
	var stars = ['★', '★', '★'].splice(0, starCount);
	this.insertSegmentDamage(br, er, stars.join(''));
};

WG.Wheel.prototype.insertSegmentDamage = function(br, er, damage) {
	var radius = 110;
	var r = er - br;
	var c = (r / 2) + br;
	var cx = 200 + radius * Math.cos(c);
	var cy = 200 + radius * Math.sin(c);
	var d  = c * 180 / Math.PI;

	// Add text
	this.paper.text(cx, cy, damage).attr({
		'fill': WG.COLORS.BLACK,
		'font-family': 'sans-serif',
		'font-size': (Math.min(Math.PI / 1.5, r * 1.2) * radius) / (damage.length < 3 ? 3 : damage.length),
		'font-weight': 'bold',
		'text-anchor': 'middle',
		'transform': 'r ' + (d - 90)
	});
};

WG.Wheel.prototype.generateSegment = function(br, er) {
	var bx = 200 + 200 * Math.cos(br);
	var by = 200 + 200 * Math.sin(br);
	var ex = 200 + 200 * Math.cos(er);
	var ey = 200 + 200 * Math.sin(er);

	return this.paper.path(['M', bx, by, 'A 200 200 0', +(er - br >= Math.PI), '1', ex, ey, 'L 200 200 Z'].join(' '));
};

WG.Wheel.prototype.insertSegment = function(segment, br) {
	this.paper.setStart();

	var er = br + 2 * Math.PI * (Math.min(segment.size, WG.WHEEL_SIZE - 0.00001) / WG.WHEEL_SIZE);
	var path = this.generateSegment(br, er);
	path.attr({ 'fill': WG.COLORS[segment.type] });


	// add stripes
	var options = {
		'stroke': 'none',
		'fill': WG.COLORS['DARK_' + segment.type],
	};
	var srb = br;
	var sr = 2 * Math.PI * (2 / WG.WHEEL_SIZE);
	for (var i = segment.size / 4; i > 0; i--) {
		this.generateSegment(srb, srb + sr).attr(options);
		srb += 2 * sr;
	}

	// Apply stroke
	path = this.paper.path().attr(path.attr());
	path.attr({
		'stroke': WG.COLORS.GRAY,
		'fill': 'none',
		'stroke-width': 3
	});

	// Apply label
	this.insertSegmentName(br, er, segment.name + (segment.effect && segment.damage ? '*' : ''));

	switch (segment.type) {
		case 'GOLD':
		case 'WHITE':
			if (segment.damage !== undefined) {
				this.insertSegmentDamage(br, er, segment.damage + segment.spinMod);
			}
			break;
		case 'PURPLE':
			this.insertSegmentStars(br, er, segment.damage);
			break;
	}

	// Add segment to segment list
	this.segments.push(this.paper.setFinish());

	return er - br;
};

WG.Wheel.prototype.update = function(figure) {
	var self = this;
	self.paper.clear();
	self.segments = self.paper.set();

	// Insert segments
	var r = 0;
	var sr = 0;
	figure.segments.forEach(function(segment) {
		sr = self.insertSegment.call(self, segment, r);
		r += sr;
	});

	// Add border
	self.wheel = self.paper.circle(200, 200, 200);
	self.wheel.attr({
		'stroke': '#000',
		'stroke-width': 8
	});

	var center = self.paper.circle(200, 200, 50);
	center.attr({
		'stroke': WG.COLORS.GRAY,
		'stroke-width': 4,
		'fill': WG.COLORS.BLACK
	});

	// Rotate segments
	self.segments.transform('r ' + (90 + ((sr / 2) * 180 / Math.PI)) + ' 200 200...');

	// Apply edges
	var edge = self.paper.set();
	var tEdge = self.paper.circle(203, 197, 200);
	var bEdge = self.paper.circle(197, 203, 200);
	tEdge.attr({ 'stroke': '#aaa' });
	bEdge.attr({ 'stroke': '#555' });
	edge.push(tEdge);
	edge.push(bEdge);
	edge.attr({ 'stroke-width': 4 });


	edge.toBack();
};
