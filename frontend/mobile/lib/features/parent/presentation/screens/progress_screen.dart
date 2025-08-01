import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:parently/core/providers/providers.dart';
import 'package:parently/core/theme/app_theme.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checkinsAsync = ref.watch(checkinsNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress & Trends'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: checkinsAsync.when(
        data: (checkins) {
          if (checkins.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.trending_up,
                    size: 64,
                    color: AppTheme.textTertiary,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No check-ins yet',
                    style: TextStyle(
                      fontSize: 18,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Start checking in to see your progress!',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textTertiary,
                    ),
                  ),
                ],
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Summary cards
                Row(
                  children: [
                    Expanded(
                      child: _buildSummaryCard(
                        context,
                        'Average Emotional State',
                        _calculateAverageEmotional(checkins),
                        '😊',
                        AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildSummaryCard(
                        context,
                        'Average Financial Stress',
                        _calculateAverageFinancial(checkins),
                        '💰',
                        AppTheme.secondaryColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Emotional state chart
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Emotional State Trend',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 200,
                          child: LineChart(
                            LineChartData(
                              gridData: FlGridData(
                                show: true,
                                drawVerticalLine: true,
                                horizontalInterval: 1,
                                verticalInterval: 1,
                                getDrawingHorizontalLine: (value) {
                                  return FlLine(
                                    color: AppTheme.textTertiary.withOpacity(0.3),
                                    strokeWidth: 1,
                                  );
                                },
                                getDrawingVerticalLine: (value) {
                                  return FlLine(
                                    color: AppTheme.textTertiary.withOpacity(0.3),
                                    strokeWidth: 1,
                                  );
                                },
                              ),
                              titlesData: FlTitlesData(
                                show: true,
                                rightTitles: AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                                topTitles: AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                                bottomTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    reservedSize: 30,
                                    interval: 1,
                                    getTitlesWidget: (double value, TitleMeta meta) {
                                      if (value.toInt() >= 0 && value.toInt() < checkins.length) {
                                        final checkin = checkins[checkins.length - 1 - value.toInt()];
                                        final date = DateTime.parse(checkin.createdAt);
                                        return SideTitleWidget(
                                          axisSide: meta.axisSide,
                                          child: Text(
                                            '${date.month}/${date.day}',
                                            style: const TextStyle(
                                              color: AppTheme.textSecondary,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        );
                                      }
                                      return const Text('');
                                    },
                                  ),
                                ),
                                leftTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    interval: 2,
                                    getTitlesWidget: (double value, TitleMeta meta) {
                                      return Text(
                                        value.toInt().toString(),
                                        style: const TextStyle(
                                          color: AppTheme.textSecondary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      );
                                    },
                                    reservedSize: 42,
                                  ),
                                ),
                              ),
                              borderData: FlBorderData(
                                show: true,
                                border: Border.all(color: AppTheme.textTertiary.withOpacity(0.3)),
                              ),
                              minX: 0,
                              maxX: (checkins.length - 1).toDouble(),
                              minY: 0,
                              maxY: 10,
                              lineBarsData: [
                                LineChartBarData(
                                  spots: _getEmotionalSpots(checkins),
                                  isCurved: true,
                                  gradient: LinearGradient(
                                    colors: [
                                      AppTheme.primaryColor,
                                      AppTheme.primaryLight,
                                    ],
                                  ),
                                  barWidth: 3,
                                  isStrokeCapRound: true,
                                  dotData: FlDotData(
                                    show: true,
                                    getDotPainter: (spot, percent, barData, index) {
                                      return FlDotCirclePainter(
                                        radius: 4,
                                        color: AppTheme.primaryColor,
                                        strokeWidth: 2,
                                        strokeColor: Colors.white,
                                      );
                                    },
                                  ),
                                  belowBarData: BarAreaData(
                                    show: true,
                                    gradient: LinearGradient(
                                      colors: [
                                        AppTheme.primaryColor.withOpacity(0.3),
                                        AppTheme.primaryColor.withOpacity(0.1),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Financial stress chart
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Financial Stress Trend',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 200,
                          child: LineChart(
                            LineChartData(
                              gridData: FlGridData(
                                show: true,
                                drawVerticalLine: true,
                                horizontalInterval: 1,
                                verticalInterval: 1,
                                getDrawingHorizontalLine: (value) {
                                  return FlLine(
                                    color: AppTheme.textTertiary.withOpacity(0.3),
                                    strokeWidth: 1,
                                  );
                                },
                                getDrawingVerticalLine: (value) {
                                  return FlLine(
                                    color: AppTheme.textTertiary.withOpacity(0.3),
                                    strokeWidth: 1,
                                  );
                                },
                              ),
                              titlesData: FlTitlesData(
                                show: true,
                                rightTitles: AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                                topTitles: AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                                bottomTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    reservedSize: 30,
                                    interval: 1,
                                    getTitlesWidget: (double value, TitleMeta meta) {
                                      if (value.toInt() >= 0 && value.toInt() < checkins.length) {
                                        final checkin = checkins[checkins.length - 1 - value.toInt()];
                                        final date = DateTime.parse(checkin.createdAt);
                                        return SideTitleWidget(
                                          axisSide: meta.axisSide,
                                          child: Text(
                                            '${date.month}/${date.day}',
                                            style: const TextStyle(
                                              color: AppTheme.textSecondary,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        );
                                      }
                                      return const Text('');
                                    },
                                  ),
                                ),
                                leftTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    interval: 2,
                                    getTitlesWidget: (double value, TitleMeta meta) {
                                      return Text(
                                        value.toInt().toString(),
                                        style: const TextStyle(
                                          color: AppTheme.textSecondary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      );
                                    },
                                    reservedSize: 42,
                                  ),
                                ),
                              ),
                              borderData: FlBorderData(
                                show: true,
                                border: Border.all(color: AppTheme.textTertiary.withOpacity(0.3)),
                              ),
                              minX: 0,
                              maxX: (checkins.length - 1).toDouble(),
                              minY: 0,
                              maxY: 10,
                              lineBarsData: [
                                LineChartBarData(
                                  spots: _getFinancialSpots(checkins),
                                  isCurved: true,
                                  gradient: LinearGradient(
                                    colors: [
                                      AppTheme.secondaryColor,
                                      AppTheme.secondaryLight,
                                    ],
                                  ),
                                  barWidth: 3,
                                  isStrokeCapRound: true,
                                  dotData: FlDotData(
                                    show: true,
                                    getDotPainter: (spot, percent, barData, index) {
                                      return FlDotCirclePainter(
                                        radius: 4,
                                        color: AppTheme.secondaryColor,
                                        strokeWidth: 2,
                                        strokeColor: Colors.white,
                                      );
                                    },
                                  ),
                                  belowBarData: BarAreaData(
                                    show: true,
                                    gradient: LinearGradient(
                                      colors: [
                                        AppTheme.secondaryColor.withOpacity(0.3),
                                        AppTheme.secondaryColor.withOpacity(0.1),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Recent check-ins list
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Recent Check-ins',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        ...checkins.take(5).map((checkin) => _buildCheckinTile(context, checkin)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: AppTheme.errorColor,
              ),
              const SizedBox(height: 16),
              Text(
                'Error loading progress',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(checkinsNotifierProvider);
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryCard(
    BuildContext context,
    String title,
    double value,
    String emoji,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              emoji,
              style: const TextStyle(fontSize: 32),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: Theme.of(context).textTheme.titleSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              value.toStringAsFixed(1),
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckinTile(BuildContext context, checkin) {
    final date = DateTime.parse(checkin.createdAt);
    final isMorning = checkin.checkinType == 'morning';
    
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: isMorning ? AppTheme.primaryColor : AppTheme.secondaryColor,
        child: Icon(
          isMorning ? Icons.wb_sunny : Icons.nightlight,
          color: Colors.white,
        ),
      ),
      title: Text(
        '${isMorning ? 'Morning' : 'Evening'} Check-in',
        style: Theme.of(context).textTheme.titleMedium,
      ),
      subtitle: Text(
        'Emotional: ${checkin.emotionalState}/10 • Financial: ${checkin.financialStress}/10',
        style: Theme.of(context).textTheme.bodyMedium,
      ),
      trailing: Text(
        '${date.month}/${date.day}',
        style: Theme.of(context).textTheme.bodySmall,
      ),
    );
  }

  double _calculateAverageEmotional(List checkins) {
    if (checkins.isEmpty) return 0;
    final sum = checkins.fold(0, (sum, checkin) => sum + checkin.emotionalState);
    return sum / checkins.length;
  }

  double _calculateAverageFinancial(List checkins) {
    if (checkins.isEmpty) return 0;
    final sum = checkins.fold(0, (sum, checkin) => sum + checkin.financialStress);
    return sum / checkins.length;
  }

  List<FlSpot> _getEmotionalSpots(List checkins) {
    return checkins.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.emotionalState.toDouble());
    }).toList();
  }

  List<FlSpot> _getFinancialSpots(List checkins) {
    return checkins.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.financialStress.toDouble());
    }).toList();
  }
} 