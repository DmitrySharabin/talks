{
let observeClass = new MutationObserver(records => {
	for (let r of records) {
		let span = r.target;

		if (!span.classList.contains("current")) {
			continue;
		}

		let box = span.getBoundingClientRect();

		// for (let property in box) {
		// 	span.style.setProperty(`--${property}`, box[property] + "px");
		// }

		span.style.setProperty("--left", box.left + "px");
		span.style.setProperty("--top", box.top + "px");
		span.style.setProperty("--right", box.right + "px");
		span.style.setProperty("--bottom", box.bottom + "px");
		span.style.setProperty("--width", box.width + "px");
		span.style.setProperty("--height", box.height + "px");
	}
});

let observeClassSettings = {
	attributes: true,
	subtree: true,
	attributeFilter: ["class"]
};

$$(".syntax-breakdown.slide").forEach(function(slide) {
	var isVertical = slide.classList.contains("vertical");
	var codes = $$(".code, code", slide);

	for (let code of codes) {
		if (!$("span[title]", code)) {
			continue;
		}

		if (isVertical && code.matches("code, code *")) {
			code.innerHTML = Prism.plugins.NormalizeWhitespace.normalize(code.innerHTML);
		}
		else if (!code.matches("[mv-app] *")) {
			code.innerHTML = code.innerHTML.replace(/[\t\r\n]/g, "");
		}

		let text = code.textContent;

		for (let span of $$("span[title]", code)) {
			// Careful: anything you do here with actual references (events, mutations etc) will be lost
			// Prism recreates these elements when it highlights
			span.classList.add("delayed");

			if (isVertical && !span.dataset.tooltip) {
				var inherited = span.closest("[data-tooltip]");
				span.dataset.tooltip = inherited? inherited.dataset.tooltip : "right";
			}

			if (text.indexOf(span.textContent) > text.length/2) {
				// FIXME will break when there are duplicates
				span.classList.add("after-middle");
			}

			observeClass.observe(span, observeClassSettings);
		}
	}
});

Prism.hooks.add("after-highlight", env => {
	if (env.element.closest(".syntax-breakdown")) {
		for (let span of $$("span[title]", env.element)) {
			observeClass.observe(span, observeClassSettings);
		}
	}
});

}
