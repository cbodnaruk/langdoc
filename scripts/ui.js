class Component {
    object
    children = []
    attributes = {}
    clickEvent
    /**
     * 
     * @param {Object} p - Component parameters
     * @param {string} p.type - The HTML tag to be used
     * @param {string} p.id - The ID of the component in the DOM
     * @param {string} [p.classList] - The classes to be added to the component, space delimited
     * @param {Function} [p.click] - The function to be triggered on click
     * @param {string} [p.text] - The text content of the component
     * 
     */
    constructor(p) {
        this.object = document.createElement(p.type)
        this.object.id = p.id
        if (p.classList) { this.object.classList.add(...p.classList.split(" ")) }
        if (p.click) { this.click = p.click }
        if (p.text) { this.text = p.text }
    }

    /**
     * Add a new class or classes to the component
     * @param {string | string[]} cssClass - The class or classes to be added
     * @returns the Component object, so methods can be chained
     */
    addClass(...cssClass) {
        if (Array.isArray(cssClass[0])) cssClass = cssClass[0]
        this.object.classList.add(...cssClass)
        return this
    }

    /**
     * Remove a class or classes (as array) from the component
     * @param {string | string[]} cssClass - The class or classes to be removed
     * @param {boolean} [strict=false] - If strict is true, then an error will be thrown if a class does not exist to be removed
     * @returns the Component object, so methods can be chained
     */
    removeClass(cssClass, strict = false) {
        if (!Array.isArray(cssClass)) cssClass = [cssClass]
        for (let c of cssClass) {
            if (this.object.classList.contains(c)) {
                this.object.classList.remove(c)
            } else {
                if (strict) throw new Error(`Cannot remove class ${c}, does not exist.`);

            }
        }
        return this
    }

    /**
     * Add a child or children components to this component
     * @param {Component} children - One or more components to be added
     * @returns the Component object, so methods can be chained
     */
    add(...children) {
        if (Array.isArray(children[0])) children = children[0]
        for (let child of children) {
            this.object.append(child.object)
            this.children.push(child)

        }
        return this
    }

    /**
     * Remove all children from the component
     */
    empty() {
        this.object.innerHTML = ""
        this.children = []
    }

    /**
     * Shorthand for setting a click event handler
     * @param {Function} fn - Function to be triggered on click
     * @return the Component object, so methods can be chained
     */
    set click(fn) {
        this.object.removeEventListener('click', this.clickEvent)
        this.clickEvent = fn
        this.object.addEventListener('click', this.clickEvent)
        return this
    }

    /**
     * 
     * @param {string} text - Component text
     */
    set text(text) {
        this.object.textContent = text
    }

    get text() {
        return this.object.textContent
    }

    /**
     * Remove the component from its parent
     */
    remove() {
        //not sure how to do this
    }

    /**
     * Proxy for Element.addEventListener
     * @param {keyof HTMLElementEventMap} trigger - The trigger event type, formatted as a string. Click events can be handled more easily with Component.click.
     * @param {Function} callback - The function to be triggered
     * @returns the Component object, so methods can be chained
     */
    addEventListener(trigger, callback) {
        this.object.addEventListener(trigger, callback)
        return this
    }

    /**
     * Proxy for Element.removeEventListener
     * @param {keyof HTMLElementEventMap} trigger - The trigger event type, formatted as a string
     * @param {Function} callback - The function being triggered
     * @returns the Component object, so methods can be chained
     */
    removeEventListener(trigger, callback) {
        this.object.removeEventListener(trigger, callback)
        return this
    }

    #attributeHandler = {
        binding: this,
        get(target, prop, receiver) {
            console.log(target, prop, receiver);
            return this.binding.attributes[prop] ?? ""
        },
        set(target, prop, val) {
            this.binding.object.setAttribute(prop, val)
            this.binding.attributes[prop] = val
            return val
        }
    }

    attribute = new Proxy(this.attributes, this.#attributeHandler)

}
/**
 * Create a new  component
 * @param {Object} p - component parameters
 * @param {string} p.type - The HTML tag to be used
 * @param {string} p.id - The ID of the component in the DOM
 * @param {string} [p.classList] - The classes to be added to the component, space delimited
 * @param {Function} [p.click] - The function to be triggered on click
 * @param {string} [p.text] - The text content of the component
 * @returns {Component}
 */
function create(p) {
    return new Component(p)
}

const body = {
    components: [],
    add: function (component) {
        document.body.append(component.object)
        this.components.push(component)
    }
}


export { Component, create }


