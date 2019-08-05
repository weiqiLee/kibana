/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AreaSeries, BarSeries, Position, LineSeries, Settings, ScaleType } from '@elastic/charts';
import { xyChart, XYChart } from './xy_expression';
import { LensMultiTable } from '../types';
import React from 'react';
import { shallow } from 'enzyme';
import { XYArgs, LegendConfig, legendConfig, layerConfig, LayerConfig } from './types';

function sampleArgs() {
  const data: LensMultiTable = {
    type: 'lens_multitable',
    tables: {
      first: {
        type: 'kibana_datatable',
        columns: [{ id: 'a', name: 'a' }, { id: 'b', name: 'b' }, { id: 'c', name: 'c' }],
        rows: [{ a: 1, b: 2, c: 3 }, { a: 1, b: 5, c: 4 }],
      },
    },
  };

  const args: XYArgs = {
    xTitle: '',
    yTitle: '',
    isHorizontal: false,
    legend: {
      isVisible: false,
      position: Position.Top,
    },
    layers: [
      {
        layerId: 'first',
        seriesType: 'line',
        xAccessor: 'c',
        accessors: ['a', 'b'],
        title: 'A and B',
        splitAccessor: 'd',
        columnToLabel: '{"a": "Label A", "b": "Label B", "d": "Label D"}',
      },
    ],
  };

  return { data, args };
}

describe('xy_expression', () => {
  describe('configs', () => {
    test('legendConfig produces the correct arguments', () => {
      const args: LegendConfig = {
        isVisible: true,
        position: Position.Left,
      };

      expect(legendConfig.fn(null, args, {})).toEqual({
        type: 'lens_xy_legendConfig',
        ...args,
      });
    });

    test('layerConfig produces the correct arguments', () => {
      const args: LayerConfig = {
        layerId: 'first',
        seriesType: 'line',
        xAccessor: 'c',
        accessors: ['a', 'b'],
        title: 'A and B',
        splitAccessor: 'd',
      };

      expect(layerConfig.fn(null, args, {})).toEqual({
        type: 'lens_xy_layer',
        ...args,
      });
    });
  });

  describe('xyChart', () => {
    test('it renders with the specified data and args', () => {
      const { data, args } = sampleArgs();

      expect(xyChart.fn(data, args, {})).toEqual({
        type: 'render',
        as: 'lens_xy_chart_renderer',
        value: { data, args },
      });
    });
  });

  describe('XYChart component', () => {
    test('it renders line', () => {
      const { data, args } = sampleArgs();

      const component = shallow(
        <XYChart
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'line' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(LineSeries)).toHaveLength(1);
    });

    test('it renders bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'bar' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(1);
    });

    test('it renders area', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'area' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(AreaSeries)).toHaveLength(1);
    });

    test('it renders horizontal bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          data={data}
          args={{ ...args, isHorizontal: true, layers: [{ ...args.layers[0], seriesType: 'bar' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(1);
      expect(component.find(Settings).prop('rotation')).toEqual(90);
    });

    test('it renders stacked bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'bar_stacked' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(1);
      expect(component.find(BarSeries).prop('stackAccessors')).toHaveLength(1);
    });

    test('it renders stacked area', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          data={data}
          args={{ ...args, layers: [{ ...args.layers[0], seriesType: 'area_stacked' }] }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(AreaSeries)).toHaveLength(1);
      expect(component.find(AreaSeries).prop('stackAccessors')).toHaveLength(1);
    });

    test('it renders stacked horizontal bar', () => {
      const { data, args } = sampleArgs();
      const component = shallow(
        <XYChart
          data={data}
          args={{
            ...args,
            isHorizontal: true,
            layers: [{ ...args.layers[0], seriesType: 'bar_stacked' }],
          }}
        />
      );
      expect(component).toMatchSnapshot();
      expect(component.find(BarSeries)).toHaveLength(1);
      expect(component.find(BarSeries).prop('stackAccessors')).toHaveLength(1);
      expect(component.find(Settings).prop('rotation')).toEqual(90);
    });

    test('it rewrites the rows based on provided labels', () => {
      const { data, args } = sampleArgs();

      const component = shallow(<XYChart data={data} args={args} />);
      expect(component.find(LineSeries).prop('data')).toEqual([
        { 'Label A': 1, 'Label B': 2, c: 3 },
        { 'Label A': 1, 'Label B': 5, c: 4 },
      ]);
    });

    test('it uses labels as Y accessors', () => {
      const { data, args } = sampleArgs();

      const component = shallow(<XYChart data={data} args={args} />);
      expect(component.find(LineSeries).prop('yAccessors')).toEqual(['Label A', 'Label B']);
    });

    test('it indicates a linear scale for a numeric X axis', () => {
      const { data, args } = sampleArgs();

      const component = shallow(<XYChart data={data} args={args} />);
      expect(component.find(LineSeries).prop('xScaleType')).toEqual(ScaleType.Linear);
    });

    test('it indicates an ordinal scale for a string X axis', () => {
      const { args } = sampleArgs();

      const data: LensMultiTable = {
        type: 'lens_multitable',
        tables: {
          first: {
            type: 'kibana_datatable',
            columns: [{ id: 'a', name: 'a' }, { id: 'b', name: 'b' }, { id: 'c', name: 'c' }],
            rows: [{ a: 1, b: 2, c: 'Hello' }, { a: 6, b: 5, c: 'World' }],
          },
        },
      };

      const component = shallow(<XYChart data={data} args={args} />);
      expect(component.find(LineSeries).prop('xScaleType')).toEqual(ScaleType.Ordinal);
    });
  });
});