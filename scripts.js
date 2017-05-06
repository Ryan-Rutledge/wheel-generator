var WG = {
	WHEEL_SIZE: 96,
	MIN_SIZE: 4,
	COLORS: {
		RED: '#E04C4C',
		WHITE: '#EEE',
		GOLD: '#EDB34B',
		PURPLE: '#CA6FE6',
		BLUE: '#52BCE8'
	},
	DARK_COLORS: {
		RED: '#D42525',
		WHITE: '#D4D4D4',
		GOLD: '#E89F1D',
		PURPLE: '#BA44DE',
		BLUE: '#25ABE2'
	},
	init: function($form, $display) {
		form = new WG.Form($form);
		//wheel = new WG.Wheel($display.find('.figure-wheel'));
		header = new WG.Header($display.find('.figure-header'));
		moveset = new WG.Moveset($display.find('.figure-moveset'));
		display = new WG.Display(form, null, header, moveset, $display.find('.figure-display-notification'));
	},
	Display: function(form, wheel, header, moveset, $notification) {
		var self = this;
		self.$notification = $notification;

		moveset.drake.on('drag', function(el) {
			index = $(el).index() - 1;
		});
		
		moveset.drake.on('drop', function(el) {
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
				//wheel.update(figure);
			}
		});

		form.change();
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
			self.change.call(self);
		});

		// Handle segment type change
		$form.find('.segment-type').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $menu = $this.parent().prev();
			var $spinMod = $segment.find('[name="segment_spin_modifier"]');
			var $effectMod = $segment.find('[name="segment_effect_modifier"]');
			var $stars = $segment.find('[name="segment_stars"]');
			var $effect = $segment.find('[name="segment_effect"]').parent();
			var $damage = $segment.find('[name="segment_damage"]');
			var $name = $segment.find('[name="segment_name"]');

			var color = $this.val();

			$segment.css('background-color', WG.COLORS[color]);

			switch (color) {
				case 'RED':
					$spinMod.hide();
					$effectMod.hide();
					$stars.hide();
					$effect.slideUp();
					$damage.hide();

					$name.attr('placeholder', 'Miss');
					$name.val('Miss');
					break;
				case 'WHITE':
				case 'GOLD':
					$stars.hide();
					$spinMod.show();
					$effectMod.show();

					if ($effect.is(':hidden')) {
						$spinMod.next().children(':first').click();
						$effectMod.next().children(':first').click();
					}
					else {
						$spinMod.next().children().eq(1).click();
						$effectMod.next().children().eq(1).click();
					}
					$damage.show();

					$name.attr('placeholder', 'Quick Attack');
					if (!$name.val() || $name.val() === 'Miss') {
						$name.val(color === 'GOLD' ? 'Quick Attack' : 'Scratch');
						$damage.val(20);
					}
					break;
				case 'PURPLE':
					$spinMod.hide();
					$effectMod.hide();
					$stars.show();
					$stars.next().children(':first').click();
					$effect.slideDown();
					$damage.hide();

					$name.attr('placeholder', 'Confusion');
					if (!$name.val() || $name.val() === 'Miss') { $name.val('Confusion'); }
					break;
				case 'BLUE':
					$stars.hide();
					$spinMod.hide();
					$effectMod.hide();
					$effect.slideDown();
					$damage.hide();

					if (!$name.val() || $name.val() === 'Miss') { $name.val('Dodge'); }
					$name.attr('placeholder', 'Dodge');
					break;
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

		// Handle segment effect modifier change
		$form.find('.segment-effect-modifier').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $effect = $segment.find('[name="segment_effect"]').parent();

			if ($this.val()) {
				$effect.slideDown();
			}
			else {
				$effect.slideUp();
			}
		});

		// Handle abliity change
		$form.find('[name="figure_ability"]').change(function() {
			var $ability = $('[name="figure_effect"]').parent();
			if ($(this).val()) {
				$ability.slideDown();
			}
			else {
				$ability.slideUp();
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
						self.change.call(self);
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
			self.change.call(self);
		});

		// Handle segment size limits
		$form.find('[name="segment_size"]').focus(function() {
			var max = WG.WHEEL_SIZE + parseInt($(this).val()) - self.total($form) ;
			$(this).attr('max', max);
		})
		.change(function() {
			// If total size is exceeded
			var total = self.total($form)
			if (total > WG.WHEEL_SIZE) {
				$(this).val(WG.WHEEL_SIZE + parseInt($(this).val()) - self.total($form));
			}

			// Make sure size is below max
			if ($(this).val() < WG.MIN_SIZE) {
				$(this).val(WG.MIN_SIZE);
			}
		});

		$form.find('textarea, input, [name]').change(function() {
			self.change.call(self);
		});

		// Create a blank segment template
		var $segmentClone = $form.find('.segment').clone(true);

		// Handle new segment events
		$form.find('.new-segment').click(function() {
			var max = WG.WHEEL_SIZE - self.total($form);

			var $newSegment = $segmentClone.clone(true).hide();

			// If next to a miss
			if (self.$segments.children(':first, :last').find('[name="segment_type"][value="RED"]').get(0)) {
				// Add white segment
				$newSegment.find('.segment-type[value="WHITE"]').click();
			}

			// Add segment
			$form.find('.segments').append($newSegment);

			// Set segment width
			$newSegment.find('[name="segment_size"]')
				.attr('max', max)
				.val(Math.min(12, max));

			// animate insertion
			$newSegment.slideDown();
			self.change.call(self);
		});
	},
	wheel: {
		generate: function(figure) {
			// Create wheel
		}
	}
};

WG.Form.prototype.total = function() {
	var self = this;
	var total = 0;
	self.$form.find('[name="segment_size"]').each(function() {
		total += parseInt($(this).val());
	});

	return total;
};

WG.Form.prototype.generateSegment = function($segment) {
	segment = {};

	segment.name = $segment.find('[name="segment_name"]').val();
	segment.size = $segment.find('[name="segment_size"]').val();
	segment.type = $segment.find('[name="segment_type"]').val();

	switch (segment.type) {
		case 'WHITE':
		case 'GOLD':
			segment.damage = $segment.find('[name="segment_damage"]').val();
			segment.spinMod = $segment.find('[name="segment_spin_modifier"]').val();
			segment.effectMod = $segment.find('[name="segment_effect_modifier"]').val();

			if (segment.spinMod) {
				segment.spin = $segment.find('[name="segment_spin_effect"]').val();
			}

			if (segment.effectMod) {
				segment.effect = $segment.find('[name="segment_effect"]').val();
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

WG.Form.prototype.generateFigure = function() {
	var self = this;
	var figure = {};
	var total = self.total();
	if (total !== WG.WHEEL_SIZE) { return { error: 'Wheel size must be 96, but is currently ' + total + '.' }; }

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
	self.$form.find('.segment').each(function(_, segment) {
		figure.segments.push(self.generateSegment($(segment)));
	});

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
};

WG.Form.prototype.change = function() {
	var figure = this.generateFigure();
	this.changeListeners.forEach(function(listener) {
		listener(figure);
	});

	// Disable new segment button if wheel is full
	this.$form.find('.new-segment').prop('disabled', this.total() >= WG.WHEEL_SIZE);
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
	var size = segment.size;
	var name = segment.name;
	var damage = '';
	var spin = '';
	var effect = '';

	switch (segment.type) {
		case 'WHITE':
		case 'GOLD':
			damage = segment.damage;

			if (segment.effectMod) {
				name += '*';
				effect = '*' + segment.effect;
			}

			if (segment.spinMod) {
				spin = segment.spin;
				damage += segment.spinMod;
			}
			break;
		case 'PURPLE':
			name += '&nbsp';
			for (var i = 0; i < segment.damage; i++) {
				name += '&nbsp;<i class="fa fa-star"></i>';
			}
			effect = segment.effect;
			break;
		case 'BLUE':
			effect = segment.effect;
			break;
	}

	$move.find('.figure-move-name').html(name);
	$move.find('.figure-move-damage').html(damage);
	$move.find('.figure-move-size').html(size);

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
