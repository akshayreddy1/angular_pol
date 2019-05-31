[![CircleCI](https://img.shields.io/circleci/project/github/platosha/angular-polymer.svg)](https://circleci.com/gh/platosha/angular-polymer) [![Version](https://img.shields.io/npm/v/angular-polymer.svg)](https://www.npmjs.com/package/angular-polymer)

# Angular-Polymer

`angular-polymer` is a directive factory that aims at bridging the gaps between using [Polymer](https://www.polymer-project.org) based Web Components in [Angular](https://angular.io/) applications.

> Note: Currently Angular-Polymer only works with Angular 2.x, or Angular-CLI 1.0.0-rc.2 and lower.
> Work is being done to upgrade the library to work the latest Angular & CLI. [Want to help Contribute?](https://github.com/platosha/angular-polymer/issues/123)

**In case you are using Angular 4+ and Polymer 2+** you might want to check out https://github.com/hotforfeature/origami

---

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { PolymerModule, PolymerElement } from '@vaadin/angular2-polymer';

@NgModule({
  imports: [ PolymerModule ],
  declarations: [
    AppComponent,
    PolymerElement('paper-input'),
    PolymerElement('vaadin-combo-box')
  ],
  bootstrap: [ AppComponent ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }

@Component({
  selector: 'app-component',
  template: `
    <paper-input [(value)]="myValue"></paper-input>
    <vaadin-combo-box [(value)]="myValue" [items]="myItems"></vaadin-combo-box>
  `
})
class AppComponent {
  myValue = 'A';
  myItems = ['A', 'B', 'C'];
}
```

## Getting started

See the overview for a [quick start](https://github.com/platosha/angular-polymer/blob/master/docs/overview.adoc#quick-start).

See the [tutorial](https://github.com/platosha/angular-polymer/blob/master/docs/tutorial-index.adoc) for complete instructions on how to use `angular-polymer` and how to build a working application with Angular data binding and routes.

If you are using [Webpack](https://webpack.github.io/) in your project, see the specific [document](https://github.com/platosha/angular-polymer/blob/master/docs/ng-cli-webpack.adoc) on how to build angular-polymer apps with webpack.

## Demo app

The Expense Manager demo is an example of a real world application built using Angular and Polymer web components.

- [Live demo](http://demo.vaadin.com/expense-manager-ng)
- [Source code](https://github.com/vaadin/expense-manager-ng2-demo)

## Where to get Polymer web components

For high quality Polymer web components, see the [Webcomponents Element Catalog](https://www.webcomponents.org/) and [Vaadin Elements](https://vaadin.com/elements).

## Development

Familiarize yourself with the code and try to follow the same syntax conventions to make it easier for us to accept your pull requests.

Discuss / exchange ideas and ask questions here:
https://polymer.slack.com/messages/polymer-angular/

### Getting the Code

1. Clone the angular-polymer project:

  ```shell
  $ git clone https://github.com/platosha/angular-polymer.git
  $ cd angular-polymer
  ```

2. Install dependencies. We assume that you have already installed `npm` in your system.

  ```shell
  $ npm install
  ```

### Running Tests

For running the tests you need [Bower](http://bower.io) installed.

Then, you can download all bower dependencies needed by the Tests.

  ```shell
  $ bower install
  ```

Finally, you can run the tests by typing:

  ```shell
  $ npm test
  ```

Optionally, you can watch for the source changes and keep the tests running automatically:

  ```shell
  $ npm run test:w
  ```

## License

Apache License 2.0
