import {
    Injector,
    Directive,
    ElementRef,
    EventEmitter,
    forwardRef,
    Renderer,
    NgZone,
    KeyValueDiffers,
    IterableDiffers,
    DefaultIterableDiffer
} from '@angular/core';
import {FormControlName, NG_VALUE_ACCESSOR} from '@angular/forms';

const Polymer: any = (<any>window).Polymer;


export function PolymerElement(name: string): any[] {
    const propertiesWithNotify: Array<any> = [];
    const arrayAndObjectProperties: Array<any> = [];

    const proto: any = Object.getPrototypeOf(document.createElement(name));
    if (proto.is !== name) {
        throw new Error(`The Polymer element "${name}" has not been registered. Please check that the element is imported correctly.`);
    }
    const isFormElement: boolean = Polymer && Polymer.IronFormElementBehavior && proto.behaviors.indexOf(Polymer.IronFormElementBehavior) > -1;
    const isCheckedElement: boolean = Polymer && Polymer.IronCheckedElementBehaviorImpl && proto.behaviors.indexOf(Polymer.IronCheckedElementBehaviorImpl) > -1;
    proto.behaviors.forEach((behavior: any) => configureProperties(behavior.properties));
    configureProperties(proto.properties);

    function configureProperties(properties: any) {
        if (properties) {
            Object.getOwnPropertyNames(properties)
                .filter(name => name.indexOf('_') !== 0)
                .forEach(name => configureProperty(name, properties));
        }
    }

    function configureProperty(name: string, properties: any) {
        let info = properties[name];
        if (typeof info === 'function') {
            info = {
                type: info
            };
        }

        if (info.type && !info.readOnly && (info.type === Object || info.type === Array)) {
            arrayAndObjectProperties.push(name);
        }

        if (info && info.notify) {
            propertiesWithNotify.push(name);
        }
    }

    const eventNameForProperty = (property: string) => `${property}Change`;

    const changeEventsAdapterDirective = Directive({
        selector: name,
        outputs: propertiesWithNotify.map(eventNameForProperty),
        host: propertiesWithNotify.reduce((hostBindings, property) => {
            hostBindings[`(${Polymer.CaseMap.camelToDashCase(property)}-changed)`] = `_emitChangeEvent('${property}', $event);`;
            return hostBindings;
        }, {})
    }).Class({
        constructor: function () {
            propertiesWithNotify
                .forEach(property => this[eventNameForProperty(property)] = new EventEmitter<any>(false));
        },

        _emitChangeEvent(property: string, event: any) {
            // Event is a notification for a sub-property when `path` exists and the
            // event.detail.value holds a value for a sub-property.

            // For sub-property changes we don't need to explicitly emit events,
            // since all interested parties are bound to the same object and Angular
            // takes care of updating sub-property bindings on changes.
            if (!event.detail.path) {
                this[eventNameForProperty(property)].emit(event.detail.value);
            }
        }
    });

    const validationDirective = Directive({
        selector: name
    }).Class({
        constructor: [ElementRef, Injector, function (el: ElementRef, injector: Injector) {
            this._element = el.nativeElement;
            this._injector = injector;
        }],

        ngDoCheck: function () {
            const control = this._injector.get(FormControlName, null);

            if (control) {
                this._element.invalid = !control.pristine && !control.valid;
            }
        }
    });

    const formElementDirective: any = Directive({
        selector: name,
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => formElementDirective),
                multi: true
            }
        ],
        host: (isCheckedElement ? {'(checkedChange)': 'onValueChanged($event)'} : {'(valueChange)': 'onValueChanged($event)'})
    }).Class({
        constructor: [Renderer, ElementRef, function (renderer: Renderer, el: ElementRef) {
            this._renderer = renderer;
            this._element = el.nativeElement;
            this._element.addEventListener('blur', () => this.onTouched(), true);
        }],

        onChange: (_: any) => {
        },
        onTouched: () => {
        },

        writeValue: function (value: any): void {
            this._renderer.setElementProperty(this._element, (isCheckedElement ? 'checked' : 'value'), value);
        },

        registerOnChange: function (fn: (_: any) => void): void {
            this.onChange = fn;
        },
        registerOnTouched: function (fn: () => void): void {
            this.onTouched = fn;
        },

        onValueChanged: function (value: any) {
            this.onChange(value);
        }
    });

    const notifyForDiffersDirective = Directive({
        selector: name,
        inputs: arrayAndObjectProperties,
        host: arrayAndObjectProperties.reduce((hostBindings, property) => {
            hostBindings[`(${Polymer.CaseMap.camelToDashCase(property)}-changed)`] = `_setValueFromElement('${property}', $event);`;
            return hostBindings;
        }, {})

    }).Class({

        constructor: [ElementRef, IterableDiffers, KeyValueDiffers, function (el: ElementRef, iterableDiffers: IterableDiffers, keyValueDiffers: KeyValueDiffers) {
            this._element = el.nativeElement;
            this._iterableDiffers = iterableDiffers;
            this._keyValueDiffers = keyValueDiffers;
            this._differs = {};
            this._arrayDiffs = {};
        }],

        ngOnInit() {
            let elm = (<any>this)._element;
            // In case the element has a default value and the directive doesn't have any value set for a property,
            // we need to make sure the element value is set to the directive.
            arrayAndObjectProperties.filter(property => elm[property] && !this[property])
                .forEach(property => {
                    this[property] = elm[property];
                });
        },

        _setValueFromElement(property: string, event: Event) {
            // Properties in this directive need to be kept synced manually with the element properties.
            // Don't use event.detail.value here because it might contain changes for a sub-property.
            let target: any = event.target;
            if (this[property] !== target[property]) {
                this[property] = target[property];
                (<any>this)._differs[property] = this._createDiffer(this[property]);
            }
        },

        _createDiffer(value: string) {
            let differ = Array.isArray(value) ? (<any>this)._iterableDiffers.find(value).create(null) : (<any>this)._keyValueDiffers.find(value || {}).create(null);

            // initial diff with the current value to make sure the differ is synced
            // and doesn't report any outdated changes on the next ngDoCheck call.
            differ.diff(value);

            return differ;
        },

        _handleArrayDiffs(property: string, diff: any) {
            if (diff) {
                diff.forEachRemovedItem((item: any) => this._notifyArray(property, item.previousIndex));
                diff.forEachAddedItem((item: any) => this._notifyArray(property, item.currentIndex));
                diff.forEachMovedItem((item: any) => this._notifyArray(property, item.currentIndex));
            }
        },

        _handleObjectDiffs(property: string, diff: any) {
            if (diff) {
                let notify = (item: any) => this._notifyPath(property + '.' + item.key, item.currentValue);
                diff.forEachRemovedItem(notify);
                diff.forEachAddedItem(notify);
                diff.forEachChangedItem(notify);
            }
        },

        _notifyArray(property: string, index: number) {
            this._notifyPath(property + '.' + index, this[property][index]);
        },

        _notifyPath(path: string, value: any) {
            (<any>this)._element.notifyPath(path, value);
        },

        ngDoCheck() {
            arrayAndObjectProperties.forEach(property => {
                let elm = (<any>this)._element;
                let _differs = (<any>this)._differs;
                if (elm[property] !== this[property]) {
                    elm[property] = this[property];
                    _differs[property] = this._createDiffer(this[property]);
                } else if (_differs[property]) {

                    // TODO: these differs won't pickup any changes in need properties like items[0].foo
                    let diff = _differs[property].diff(this[property]);
                    if (diff instanceof DefaultIterableDiffer) {
                        this._handleArrayDiffs(property, diff);
                    } else {
                        this._handleObjectDiffs(property, diff);
                    }
                }
            });
        }
    });

    const reloadConfigurationDirective = Directive({
        selector: name
    }).Class({
        constructor: [ElementRef, NgZone, function (el: ElementRef, zone: NgZone) {
            el.nativeElement.async(() => {
                if (el.nativeElement.isInitialized()) {
                    // Reload outside of Angular to prevent unnecessary ngDoCheck calls
                    zone.runOutsideAngular(() => {
                        el.nativeElement.reloadConfiguration();
                    });
                }
            });
        }],
    });

    let directives = [changeEventsAdapterDirective, notifyForDiffersDirective];

    if (isFormElement) {
        directives.push(formElementDirective);
        directives.push(validationDirective);
    }

    // If the element has isInitialized and reloadConfiguration methods (e.g., Charts)
    if (typeof proto.isInitialized === 'function' &&
        typeof proto.reloadConfiguration === 'function') {
        directives.push(reloadConfigurationDirective);
    }

    return directives;
}
