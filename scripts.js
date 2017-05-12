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
		WG.form = new WG.Form($form);
		WG.wheel = new WG.Wheel($display.find('.figure-wheel'));
		WG.header = new WG.Header($display.find('.figure-header'));
		WG.moveset = new WG.Moveset($display.find('.figure-moveset'));
		WG.display = new WG.Display(WG.form, WG.wheel, WG.header, WG.moveset, $display.find('.figure-display-notification'));
	},
	fullscreenInit: function(form, $display) {
		WG.bigWheel = new WG.Wheel($display.find('.big-wheel'));
		WG.bigMoveset = new WG.Moveset($display.find('.big-moveset'));

		$(WG.bigWheel.center
			.attr('title', 'Click to spin')
			.node()).tooltip();

		function update() {
			setTimeout(function() {
				var figure = form.extractFigure();
				if (figure.error) { figure = { segments: [] }; }

				WG.bigWheel.update.call(WG.bigWheel, figure);
				WG.bigMoveset.update.call(WG.bigMoveset, figure);
			}, 100);
		}

		$('.show-big-display').click(update);
		update();
	},
	Display: function(form, wheel, header, moveset, $notification) {
		var self = this;
		self.$notification = $notification;
		var index;

		moveset.drake = dragula([moveset.$moveset.get(0)], {
			moves: function(el, source) {
				return $(el).is('.figure-move');
			},
			accepts: function(el, target, source, sibling) {
				return $(sibling).is('.figure-move');
			},
			direction: 'vertical',
			ignoreInputTextSelection: true,
			mirrorContainer: moveset.$moveset.get(0)
		});

		moveset.drake.on('drag', function(el) {
			index = $(el).index() - 1;
		});
		
		moveset.drake.on('dragend', function(el) {
			var new_index = $(el).index() - 1;
			form.move(index, new_index);
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

		if (localStorage) {
			var figure = localStorage.getItem('figure');

			if (figure) {
				form.changeDisabled = true;

				try {
					form.update(JSON.parse(figure));
				}
				catch (e) {
					console.error('Unable to load figure data from cache: ' + e);
					form.update({ segments: [ { type: 'RED', size: '96', name: 'Miss' } ] });
				}

				form.changeDisabled = false;
			}
		}

		form.change();
	},
	Header: function($header) {
		var self = this;
		self.$header = $header;
	},
	Moveset: function($moveset) {
		this.$moveset = $moveset;
	},
	Form: function($form) {
		var self = this;
		self.fancy = true;
		self.$form = $form;
		self.$segments = $form.find('.segments');
		self.changeListeners = [];

		// Handle dropdown selection menus
		$form.find('.dropdown-item-option').click(function() {
			var $this = $(this);
			var $menu = $this.parent().prev();
			$menu.html($this.data('val'));
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

			var defaultNames = {
				'RED': 'Miss',
				'WHITE': 'Scratch',
				'GOLD': 'Quick Attack',
				'PURPLE': 'Sing',
				'BLUE': 'Dodge'
			}

			switch (color) {
				case 'RED':
					$spinMod.hide();
					$stars.hide();
					if (self.fancy) {
						$effect.slideUp();
					}
					else {
						$effect.hide();
					}
					$damage.hide();
					break;
				case 'WHITE':
				case 'GOLD':
					$stars.hide();
					$spinMod.show();
					$effect.show();
					$spinMod.next().children(':first').click();
					$damage.val(10).show();
					break;
				case 'PURPLE':
					$spinMod.hide();
					$stars.show();
					$stars.next().children(':first').click();
					if (self.fancy) {
						$effect.slideDown();
					}
					else {
						$effect.show();
					}
					$damage.hide();
					break;
				case 'BLUE':
					$stars.hide();
					$spinMod.hide();
					if (self.fancy) {
						$effect.slideDown();
					}
					else {
						$effect.show();
					}
					$damage.hide();
					break;
			}

			$name.attr('placeholder', defaultNames[color]);
			$name.val(defaultNames[color]);
		});

		// Handle segment spin modifier change
		$form.find('.segment-spin-modifier').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $effect = $segment.find('[name="segment_spin_effect"]').parent();

			if ($this.val()) {
				if (self.fancy) {
					$effect.slideDown();
				}
				else {
					$effect.show();
				}
			}
			else {
				if (self.fancy) {
					$effect.slideUp();
					$effect.hide();
				}
			}
		});

		// Handle abliity change
		$form.find('[name="figure_ability"]').focus(function() {
			var $ability = $('[name="figure_effect"]').parent();

			if (self.fancy) {
				$ability.slideDown();
			}
			else {
				$ability.show();
			}
		}).blur(function() {
			if (!$(this).val()) {
				var $ability = $('[name="figure_effect"]').parent();

				if (self.fancy) {
					$ability.slideUp();
				}
				else {
					$ability.hide();
				}
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
				var $segment = $(this).closest('.segment');
				function after() {
					$segment.remove();
					self.fillMiss();
					self.change.call(self);
				}
				
				if (self.fancy) {
					$segment
						.slideUp(function() {
							$segment.remove();
							self.fillMiss();
							self.change.call(self);
						});
				}
				else {
					after();
				}
			})

			// Handle hover effect
			.hover(function() {
				$(this).closest('.segment').css('opacity', '0.7');
			}, function() {
				$(this).closest('.segment').css('opacity', '');
			});
		
		// Activate dragula
		var drake = dragula([$form.find('.segments').get(0)], {
			moves: function(el, source, handle) {
				 return $(handle).is('.drag-handle')
			},
			direction: 'vertical',
			mirrorContainer: $form.find('.segments').get(0)
		});

		drake.on('dragend', function(el) {
			self.change.call(self);
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
			self.change.call(self);
		});
		$form.find('.dropdown-item-option').click(function() {
			self.change.call(self);
		});

		// Create a blank segment template
		self.$segmentClone = $form.find('.segment').clone(true);

		// Handle new segment events
		$form.find('.new-segment').click(function() {
			self.changeDisabled = true;

			var $newSegment = self.$segmentClone.clone(true).hide();

			// If next to a miss
			if (self.$segments.children(':first, :last').has('[name="segment_type"][value="RED"]').get(0)) {
				// Add white segment
				$newSegment.find('.segment-type[value="WHITE"]').click();
			}

			// Add segment
			$form.find('.segments').append($newSegment);

			// Set segment width
			$newSegment.find('[name="segment_size"]').val(WG.MIN_SIZE);

			// animate insertion
			if (self.fancy) {
				$newSegment.slideDown();
			}
			else {
				$newSegment.show();
			}

			self.fillMiss();
			self.changeDisabled = false;
			self.change.call(self);
		});

		// Setup default miss
		$form.find('.segment [name="segment_size"]').val(WG.WHEEL_SIZE);
	},
	Wheel: function($wheel) {
		var self = this;
		self.r = /^rotate\((\d+(?:\.\d+)?)(?: .*)?\)$/;
		self.fancy = true;
		self.$wheel = $wheel;

		self.canvas = d3.select($wheel.get(0));

		// Apply wheel edges
		self.canvas.append('circle')
			.attr('cx', 203)
			.attr('cy', 197)
			.attr('r', 200)
			.attr('fill', 'none')
			.attr('stroke-width', 4)
			.attr('stroke', '#aaa');
		self.canvas.append('circle')
			.attr('cx', 197)
			.attr('cy', 203)
			.attr('r', 200)
			.attr('fill', 'none')
			.attr('stroke-width', 4)
			.attr('stroke', '#555');

		// Apply spinning group
		self.wheel = self.canvas.append('g')
			.attr('class', 'figure-wheel-segments');

		// Add center piece
		self.center = self.canvas.append('circle')
			.attr('cx', 200)
			.attr('cy', 200)
			.attr('r', 50)
			.attr('stroke', WG.COLORS.GRAY)
			.attr('stroke-width', 4)
			.attr('fill', WG.COLORS.BLACK)
			.attr('class', 'figure-wheel-center');

		// Apply wheel spin
		self.center.on('click', function() {
			self.spin();
		});

		// // Apply wheel border
		self.ring = self.canvas.append('circle')
			.attr('cx', 200)
			.attr('cy', 200)
			.attr('r', 200)
			.attr('fill', 'none')
			.attr('stroke', WG.COLORS.BLACK)
			.attr('stroke-width', 8);

		// Add needle
		self.needleOn = 'rotate(315 200 200) translate(0 0)';
		self.needleOff = 'rotate(315 200 200) translate(200 0)';

		var r  = Math.PI * (1 - WG.WHEEL_SIZE / 100);
		var bx = 200 + 200 * Math.cos(r);
		var by = 200 + 200 * Math.sin(r);
		var ex = 200 + 200 * Math.cos(-r);
		var ey = 200 + 200 * Math.sin(-r);
		self.needle = self.canvas.append('g')
		self.needle.append('polygon')
			.attr('points', [bx, by, 440, 200, ex, ey, 360, 200].join(' '))
			.attr('stroke', '#fff')
			.attr('stroke-width', 1)
			.attr('fill', '#e03');
		r /= 2;
		bx = 200 + 200 * Math.cos(r);
		by = 200 + 200 * Math.sin(r);
		ex = 200 + 200 * Math.cos(-r);
		ey = 200 + 200 * Math.sin(-r);
		self.needle.append('polygon')
			.attr('points', [bx, by, 425, 200, ex, ey, 375, 200].join(' '))
			.attr('stroke', 'none')
			.attr('fill', '#d02');

		self.needle
			.attr('transform', self.needleOff)
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
	var disabled = self.changeDisabled;
	self.changeDisabled = true;
	self.$form.find('[name="figure_name"]').val(figure.name);
	self.$form.find('[name="figure_type_1"]').val(figure.type && figure.type[0]);
	self.$form.find('[name="figure_type_2"]').val(figure.type && figure.type[1]);
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
	if (figure.segments) {
		figure.segments.forEach(function(segment) {
			self.$segments.append(
				self.generateSegment.call(self, segment)
			);
		});
	}

	self.changeDisabled = disabled;

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

	figure.name    = self.$form.find('[name="figure_name"]').val();
	figure.mp      = self.$form.find('[name="figure_mp"]').val();
	figure.ability = self.$form.find('[name="figure_ability"]').val();
	figure.type    = [];

	var type1 = self.$form.find('[name="figure_type_1"]').val();
	var type2 = self.$form.find('[name="figure_type_2"]').val();
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
	var self = this;
	var figure = self.extractFigure();

	var $misses = self.$segments.children().has('[name="segment_type"][value="RED"]');

	var filled = !$misses.filter(function() {
		return $(this).find('[name="segment_size"]').val() > WG.MIN_SIZE;
	}).get(0) && self.total() >= WG.WHEEL_SIZE;

	// Disable button if there is no room left
	self.$form.find('.new-segment').prop('disabled', filled);

	// Apply change handlers
	self.changeListeners.forEach(function(listener) {
		listener(figure);
	});
};

WG.Form.prototype.change = function() {
	var self = this;
	if (self.changeDisabled) return;

	self.handleChange(self);

	// Save changes after 10 seconds
	if (localStorage) {
		if (self.saveTimeout) clearTimeout(self.saveTimeout);
		self.saveTimeout = setTimeout(function() {
				try {
					localStorage.setItem('figure', JSON.stringify(self.extractFigure()));
				}
				catch (e) {
					console.error('Unable to save figure data to cache: ' + e);
				}
		}, 10000);
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
	this.$header.find('.figure-mp').text(figure.mp || '[Not Provided]');
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

WG.Wheel.prototype.insertSegmentName = function(br, er, text, g) {
	var self = this;
	var radius = 175;
	var y = 200 + radius;
	var r = er - br;
	var size = Math.min(radius / 5, (r * radius) / (text.length * 1.5));

	var tmp = g.append('text')
		.attr('font-family', 'monospace')
		.attr('font-size', size)
		.attr('text-anchor', 'end')
		.attr('stroke-width', 0)
		.text(text)
	var letterSize = tmp.node().getComputedTextLength() / text.length;
	tmp.remove();

	var t = (letterSize / (radius * 1.5)) * Math.PI;
	var padding = (r - t*text.length) / 2;

	// For each letter
	var cr = er - padding - (t / 2);
	text.split('').forEach(function(l) {
		var d = cr * 180 / Math.PI;
		
		// Create character
		g.append('text')
			.attr('x', 200)
			.attr('y', y)
			.attr('fill', WG.COLORS.BLACK)
			.attr('fill', 'color')
			.attr('font-family', 'monospace')
			.attr('font-size', size)
			.attr('font-weight', 'bold')
			.attr('text-anchor', 'middle')
			.attr('stroke-width', 0)
			.attr('dominant-baseline', 'central')
			.attr('transform', 'rotate(' + (d - 90) + ' 200 200)')
			.text(l);

		cr -= t;
	});
};

WG.Wheel.prototype.insertSegmentStars = function(br, er, starCount, g) {
	var stars = ['★', '★', '★'].splice(0, starCount);
	this.insertSegmentDamage(br, er, stars.join(''), g);
};

WG.Wheel.prototype.insertSegmentDamage = function(br, er, damage, g) {
	var radius = 110;
	var r = er - br;
	var c = (r / 2) + br;
	var d  = (c * 180 / Math.PI) - 90;

	// Add text
	var text = g.append('text')
		.attr('x', 200)
		.attr('y', 200 + radius)
		.attr('fill', WG.COLORS.BLACK)
		.attr('font-family', 'sans-serif')
		.attr('font-size', (Math.min(Math.PI / 1.5, r * 1.2) * radius) / (damage.length < 3 ? 3 : damage.length))
		.attr('font-weight', 'bold')
		.attr('text-anchor', 'middle')
		.attr('dominant-baseline', 'central')
		.attr('transform', 'rotate(' + d + ' 200 200)')
		.text(damage);

	return text;
};

WG.Wheel.prototype.generateSegment = function(br, er, g) {
	var bx = 200 + 200 * Math.cos(br);
	var by = 200 + 200 * Math.sin(br);
	var ex = 200 + 200 * Math.cos(er);
	var ey = 200 + 200 * Math.sin(er);
	var path = g.append('path')
		.attr('d', ['M', bx, by, 'A 200 200 0', +(er - br >= Math.PI), '1', ex, ey, 'L 200 200 Z'].join(' '));

	return path;
};

WG.Wheel.prototype.insertSegment = function(segment, br) {
	var er = br + 2 * Math.PI * (Math.min(segment.size, WG.WHEEL_SIZE - 0.00001) / WG.WHEEL_SIZE);
	var g = this.wheel.append('g');
	var path = this.generateSegment(br, er, g);
	path.attr('fill', WG.COLORS[segment.type]);
	path.attr('stroke', WG.COLORS.GRAY);
	path.attr('stroke-width', 4);

	if (this.fancy) {
		// add stripes
		var options = {
			'stroke': WG.COLORS.DARK,
			'stroke-width': 4,
			'fill': WG.COLORS['DARK_' + segment.type],
		};
		var srb = br;
		var sr = 2 * Math.PI * (2 / WG.WHEEL_SIZE);
		for (var i = segment.size / 4; i > 0; i--) {
			this.generateSegment(srb, srb + sr, g)
				.attr('stroke', 'none')
				.attr('fill', WG.COLORS['DARK_' + segment.type]);
			srb += 2 * sr;
		}

		// Apply stroke
		var stroke = g.append('path')
		   .attr('d', path.attr('d'))
		   .attr('stroke', WG.COLORS.GRAY)
		   .attr('fill', 'none')
		   .attr('stroke-width', 3);
	}

	var name = segment.name;
	switch (segment.type) {
		case 'GOLD':
		case 'WHITE':
			if (segment.damage !== undefined) {
				this.insertSegmentDamage(br, er, segment.damage + segment.spinMod, g);
			}
			
			name += segment.effect && segment.damage ? '*' : '';
			break;
		case 'PURPLE':
			this.insertSegmentStars(br, er, segment.damage, g);
			break;
	}

	if (segment.size > 4 && (segment.size >= segment.name.length || this.fancy)) {
		this.insertSegmentName(br, er, name, g);
	}

	return er - br;
};


WG.Wheel.prototype.getSpin = function() {
	var g = this.r.exec(this.wheel.attr('transform'));
	return g && parseFloat(g[1]) || 0;
};

WG.Wheel.prototype.reset = function(delay) {
	var self = this;
	var spin = self.getSpin() % 360;
	if (spin > self.rotation + 180) {
		spin = spin - 360;
	}

	// Return to normal state
	self.wheel
		.transition()
		.duration(3000 * (Math.abs(self.rotation - spin) / 360) + 1000)
		.delay(delay)
		.ease(d3.easeElasticOut)
		.attrTween('transform', function() {
			return d3.interpolateString('rotate(' + spin + ' 200 200)', 'rotate(' + self.rotation + ' 200 200)');
		});
};

WG.Wheel.prototype.spin = function() {
	var self = this;
	var rotations = (Math.random() * 12 + 8)
	var needleDuration = 200;
	var duration = 150 * rotations;
	var delay = 4000;
	var d = 360 * rotations + self.getSpin();

	// Show needle
	self.needle
		.transition()
		.delay(duration - needleDuration)
		.duration(needleDuration)
		.ease(d3.easeBackIn)
		.attrTween('transform', function() {
			return d3.interpolateString(self.needle.attr('transform'), self.needleOn);
		})
		.on('end', function() {
			self.needle
				.transition()
				.delay(delay)
				.ease(d3.easeBackIn)
				.attrTween('transform', function() {
					return d3.interpolateString(self.needle.attr('transform'), self.needleOff);
				})
		});

	// Rotate
	self.wheel
		.transition()
		.duration(duration)
		.ease(d3.easeLinear)
		.attrTween('transform', function() {
			return d3.interpolateString(self.wheel.attr('transform'), 'rotate(' + d + ' 200 200)');
		})
		.on('end', function() {
			self.reset(delay);
		});
};

WG.Wheel.prototype.update = function(figure) {
	var self = this;

	// Clear wheel
	self.wheel.html('');

	// Insert segments
	var r = 0;
	var sr = 0;
	figure.segments.forEach(function(segment) {
		sr = self.insertSegment.call(self, segment, r);
		r += sr;
	});

	// Rotate so last segment is centered
	self.rotation = (90 + ((sr / 2) * 180 / Math.PI))
	self.wheel
		.attr('transform', 'rotate(' + self.rotation + ' 200 200)');
};
