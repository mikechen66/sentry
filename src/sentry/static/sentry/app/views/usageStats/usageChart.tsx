import React from 'react';
import Color from 'color';
import {withTheme} from 'emotion-theming';
import moment from 'moment';

import BaseChart from 'app/components/charts/baseChart';
import Legend from 'app/components/charts/components/legend';
import Tooltip from 'app/components/charts/components/tooltip';
import xAxis from 'app/components/charts/components/xAxis';
import OptionSelector from 'app/components/charts/optionSelector';
import barSeries from 'app/components/charts/series/barSeries';
import {
  ChartContainer,
  ChartControls,
  HeaderTitleLegend,
  InlineContainer,
  SectionValue,
} from 'app/components/charts/styles';
import Panel from 'app/components/panels/panel';
import ChartPalette from 'app/constants/chartPalette';
import {IconCalendar} from 'app/icons';
import {t} from 'app/locale';
import {DataCategory, SelectValue} from 'app/types';
import {formatAbbreviatedNumber} from 'app/utils/formatters';
import commonTheme, {Theme} from 'app/utils/theme';

import {OrganizationUsageStats, UsageStat} from './types';
import {formatUsageWithUnits, getDateRange, GIGABYTE} from './utils';

const COLOR_ERRORS = ChartPalette[4][3];
const COLOR_ERRORS_DROPPED = Color(COLOR_ERRORS).lighten(0.25).string();

const COLOR_TRANSACTIONS = ChartPalette[4][2];
const COLOR_TRANSACTIONS_DROPPED = Color(COLOR_TRANSACTIONS).lighten(0.25).string();

const COLOR_ATTACHMENTS = ChartPalette[4][1];
const COLOR_ATTACHMENTS_DROPPED = Color(COLOR_ATTACHMENTS).lighten(0.5).string();
const COLOR_PROJECTED = commonTheme.gray200;

export const CHART_OPTIONS_DATACATEGORY: SelectValue<DataCategory>[] = [
  {
    label: 'Errors',
    value: DataCategory.ERRORS,
    disabled: false,
  },
  {
    label: 'Transactions',
    value: DataCategory.TRANSACTIONS,
    disabled: false,
  },
  {
    label: 'Attachments',
    value: DataCategory.ATTACHMENTS,
    disabled: false,
  },
];

export const CHART_OPTIONS_TYPE: SelectValue<string>[] = [
  {
    label: 'Summary',
    value: 'summary',
    disabled: false,
  },
  {
    label: 'Day-to-Day',
    value: 'day',
    disabled: false,
  },
];

export enum SeriesTypes {
  ACCEPTED = 'Accepted',
  DROPPED = 'Dropped',
  PROJECTED = 'Projected',
}

type Props = {
  theme: Theme;

  hasTransactions: boolean; // TODO(cleanup): Probabaly should move back to ReservedUsageChart
  hasAttachments: boolean; // TODO(cleanup): Move back
  usagePeriodStart: string;
  usagePeriodEnd: string;

  statsAttachments: OrganizationUsageStats['statsAttachments'];
  statsErrors: OrganizationUsageStats['statsErrors'];
  statsTransactions: OrganizationUsageStats['statsTransactions'];

  handleSelectDataCategory: (category: DataCategory) => void;
};

type State = {
  xAxisDates: string[];
  chartDisplay: DataCategory;
  chartType: string;
};

export class UsageChart<
  P extends Props = Props,
  S extends State = State
> extends React.Component<P, S> {
  static defaultProps = {
    handleSelectDataCategory: () => {},
  };

  state = {
    xAxisDates: [] as string[],
    chartDisplay: DataCategory.ERRORS,
    chartType: 'summary',
  } as Readonly<S>;

  static getDerivedStateFromProps(props: Readonly<Props>) {
    const {usagePeriodStart, usagePeriodEnd} = props;
    const xAxisDates = getDateRange(usagePeriodStart, usagePeriodEnd);

    return {
      xAxisDates,
    };
  }

  mapStatsToChart(stats: UsageStat[] = []) {
    /*
    const {xAxisDates} = this.state;
    const isCumulative = this.state.chartType === 'summary';
    const sumAccepted = 0;
    const sumDropped = 0;
    */
    const chartData: Record<string, any[]> = {
      acceptedStats: [],
      droppedStats: [],
      projectedStats: [],
    };

    /*
    xAxisDates.forEach(date => {
      const stat = stats.find(
        s =>
          date === getDateFromMoment(moment(s.date)) ||
          date === getDateFromUnixTimestamp(Number(s.ts))
      );

      const accepted = stat ? stat.accepted : 0;
      const dropped = stat ? stat.dropped.total : 0;

      sumDropped = isCumulative ? sumDropped + dropped : dropped;
      sumAccepted = isCumulative ? sumAccepted + accepted : accepted;

      chartData.acceptedStats.push({
        value: [date, sumAccepted],
        tooltip: {show: false},
      });
      // chartData.droppedStats.push({
      //   value: [date, sumDropped],
      //   tooltip: {show: false},
      //   dropped: {
      //     other: sumOther,
      //     overQuota: sumOverQuota,
      //     spikeProtection: sumSpikeProtection,
      //   } as DroppedBreakdown,
      // });
    });

    */
    return chartData;
  }

  handleSelectorForType(value: string) {
    this.setState({chartType: value});
  }

  handleSelectorForDisplay(value: DataCategory) {
    this.setState({chartDisplay: value});
    this.props.handleSelectDataCategory(value);
  }

  get chartColors() {
    const {chartDisplay} = this.state;

    if (chartDisplay === DataCategory.ERRORS) {
      return [COLOR_ERRORS, COLOR_ERRORS_DROPPED, COLOR_PROJECTED];
    }

    if (chartDisplay === DataCategory.ATTACHMENTS) {
      return [COLOR_ATTACHMENTS, COLOR_ATTACHMENTS_DROPPED, COLOR_PROJECTED];
    }
    return [COLOR_TRANSACTIONS, COLOR_TRANSACTIONS_DROPPED, COLOR_PROJECTED];
  }

  get chartData() {
    const {statsErrors, statsTransactions, statsAttachments} = this.props;
    const {xAxisDates, chartDisplay} = this.state;

    const display = CHART_OPTIONS_DATACATEGORY.find(o => o.value === chartDisplay);
    if (!display) {
      throw new Error('Selected item is not supported');
    }

    const {label, value} = display;

    if (value === DataCategory.ERRORS) {
      return {
        chartLabel: label,
        chartData: this.mapStatsToChart(statsErrors),
        xAxisData: xAxisDates,
        yAxisMinInterval: 1000,
        yAxisFormatter: formatAbbreviatedNumber,
        yAxisQuotaLine: 0,
        tooltipValueFormatter: (val: number) => val.toLocaleString(),
      };
    }

    if (value === DataCategory.TRANSACTIONS) {
      return {
        chartLabel: label,
        chartData: this.mapStatsToChart(statsTransactions),
        xAxisData: xAxisDates,
        yAxisMinInterval: 1000,
        yAxisFormatter: formatAbbreviatedNumber,
        yAxisQuotaLine: 0,
        tooltipValueFormatter: (val: number) => val.toLocaleString(),
      };
    }

    return {
      chartLabel: label,
      chartData: this.mapStatsToChart(statsAttachments),
      xAxisData: xAxisDates,
      yAxisMinInterval: 1 * GIGABYTE,
      yAxisFormatter: (val: number) =>
        formatUsageWithUnits(val, DataCategory.ATTACHMENTS, {
          isAbbreviated: true,
          useUnitScaling: true,
        }),
      yAxisQuotaLine: 0,
      tooltipValueFormatter: (val: number) =>
        formatUsageWithUnits(val, DataCategory.ATTACHMENTS, {useUnitScaling: true}),
    };
  }

  get chartBarSeries() {
    const {chartData} = this.chartData;

    return [
      barSeries({
        name: SeriesTypes.ACCEPTED,
        data: chartData.acceptedStats,
        barMinHeight: 1,
        stack: 'usage',
        legendHoverLink: false,
      }),
      barSeries({
        name: SeriesTypes.DROPPED,
        data: chartData.droppedStats,
        stack: 'usage',
        legendHoverLink: false,
      }),
      barSeries({
        name: SeriesTypes.PROJECTED,
        data: chartData.projectedStats,
        barMinHeight: 1,
        stack: 'usage',
        legendHoverLink: false,
      }),
    ];
  }

  get chartTooltip() {
    return Tooltip({});
    /*
    const {tooltipValueFormatter} = this.chartData;

    return Tooltip({
      // Trigger to axis prevents tooltip from redrawing when hovering
      // over individual bars
      trigger: 'axis',
      // Custom tooltip implementation as we show a breakdown for dropped results.
      formatter(series) {
        const seriesList = Array.isArray(series) ? series : [series];
        const time = seriesList[0]?.value?.[0];
        return [
          '<div class="tooltip-series">',
          seriesList
            .map(s => {
              const label = s.seriesName ?? '';
              const value = tooltipValueFormatter(s.value?.[1]);

              const dropped = s.data.dropped as DroppedBreakdown | undefined;
              if (typeof dropped === 'undefined' || value === '0') {
                return `<div><span class="tooltip-label">${s.marker} <strong>${label}</strong></span> ${value}</div>`;
              }
              const other = tooltipValueFormatter(dropped.other);
              const overQuota = tooltipValueFormatter(dropped.overQuota);
              const spikeProtection = tooltipValueFormatter(dropped.spikeProtection);
              // Used to shift breakdown over the same amount as series markers.
              const indent = '<span style="display: inline-block; width: 15px"></span>';
              const labels = [
                `<div><span class="tooltip-label">${s.marker} <strong>${t(
                  'Dropped'
                )}</strong></span> ${value}</div>`,
                `<div><span class="tooltip-label">${indent} <strong>${t(
                  'Over Quota'
                )}</strong></span> ${overQuota}</div>`,
                `<div><span class="tooltip-label">${indent} <strong>${t(
                  'Spike Protection'
                )}</strong></span> ${spikeProtection}</div>`,
                `<div><span class="tooltip-label">${indent} <strong>${t(
                  'Other'
                )}</strong></span> ${other}</div>`,
              ];
              return labels.join('');
            })
            .join(''),
          '</div>',
          `<div class="tooltip-date">${time}</div>`,
          `<div class="tooltip-arrow"></div>`,
        ].join('');
      },
    });
    */
  }

  get chartLegendSeries() {
    return [
      {
        name: SeriesTypes.ACCEPTED,
      },
      {
        name: SeriesTypes.DROPPED,
      },
      {
        name: SeriesTypes.PROJECTED,
      },
    ];
  }

  renderFooter() {
    const {usagePeriodStart, usagePeriodEnd} = this.props;

    return (
      <ChartControls>
        <InlineContainer>
          <SectionValue>
            <IconCalendar />
          </SectionValue>
          <SectionValue>
            {moment(usagePeriodStart).format('ll')}
            {' — '}
            {moment(usagePeriodEnd).format('ll')}
          </SectionValue>
        </InlineContainer>
        <InlineContainer>
          <OptionSelector
            title={t('Type')}
            selected={this.state.chartType}
            options={CHART_OPTIONS_TYPE}
            onChange={(val: string) => this.handleSelectorForType(val)}
          />
          <OptionSelector
            title={t('Display')}
            menuWidth="135px"
            selected={this.state.chartDisplay}
            options={CHART_OPTIONS_DATACATEGORY}
            onChange={(val: string) => this.handleSelectorForDisplay(val as DataCategory)}
          />
        </InlineContainer>
      </ChartControls>
    );
  }

  render() {
    const {theme} = this.props;
    const {xAxisData, yAxisMinInterval, yAxisFormatter} = this.chartData;

    return (
      <Panel id="usage-chart">
        <ChartContainer>
          <HeaderTitleLegend>{t('Current Usage Period')}</HeaderTitleLegend>
          <BaseChart
            colors={this.chartColors}
            grid={{bottom: '3px', left: '0px', right: '10px', top: '40px'}}
            xAxis={xAxis({
              show: true,
              type: 'category',
              name: 'Date',
              boundaryGap: true,
              data: xAxisData,
              truncate: 6,
              axisTick: {
                interval: 6,
                alignWithLabel: true,
              },
              axisLabel: {
                interval: 6,
              },
              theme,
            })}
            yAxis={{
              min: 0,
              minInterval: yAxisMinInterval,
              axisLabel: {
                formatter: yAxisFormatter,
                color: theme.chartLabel,
              },
            }}
            series={this.chartBarSeries}
            tooltip={this.chartTooltip}
            onLegendSelectChanged={() => {}}
            legend={Legend({
              right: 10,
              top: 5,
              data: this.chartLegendSeries,
              theme,
            })}
          />
        </ChartContainer>
        {this.renderFooter()}
      </Panel>
    );
  }
}

export default withTheme(UsageChart);
