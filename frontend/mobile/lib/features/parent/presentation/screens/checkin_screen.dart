import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:parently/core/providers/providers.dart';
import 'package:parently/core/theme/app_theme.dart';

class CheckinScreen extends ConsumerStatefulWidget {
  const CheckinScreen({super.key});

  @override
  ConsumerState<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends ConsumerState<CheckinScreen> {
  String _checkinType = 'morning';
  double _emotionalState = 5.0;
  double _financialStress = 5.0;
  final _notesController = TextEditingController();
  final _expensesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _notesController.dispose();
    _expensesController.dispose();
    super.dispose();
  }

  Future<void> _submitCheckin() async {
    if (_isSubmitting) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      await ref.read(checkinsNotifierProvider.notifier).createCheckin(
        checkinType: _checkinType,
        emotionalState: _emotionalState.round(),
        financialStress: _financialStress.round(),
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        unexpectedExpenses: _expensesController.text.isNotEmpty 
            ? double.tryParse(_expensesController.text) ?? 0.0 
            : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Check-in submitted successfully!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting check-in: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  String _getEmotionalLabel(double value) {
    if (value <= 2) return '😢 Very Low';
    if (value <= 4) return '😔 Low';
    if (value <= 6) return '😐 Neutral';
    if (value <= 8) return '😊 Good';
    return '😄 Excellent';
  }

  String _getFinancialLabel(double value) {
    if (value <= 2) return '😰 Very Stressed';
    if (value <= 4) return '😟 Stressed';
    if (value <= 6) return '😐 Moderate';
    if (value <= 8) return '😌 Relaxed';
    return '😌 Very Relaxed';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Check-in'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Check-in type selector
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Check-in Type',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: RadioListTile<String>(
                            title: const Text('Morning'),
                            subtitle: const Text('Start of day'),
                            value: 'morning',
                            groupValue: _checkinType,
                            onChanged: (value) {
                              setState(() {
                                _checkinType = value!;
                              });
                            },
                          ),
                        ),
                        Expanded(
                          child: RadioListTile<String>(
                            title: const Text('Evening'),
                            subtitle: const Text('End of day'),
                            value: 'evening',
                            groupValue: _checkinType,
                            onChanged: (value) {
                              setState(() {
                                _checkinType = value!;
                              });
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Emotional state slider
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'How are you feeling emotionally?',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _getEmotionalLabel(_emotionalState),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: AppTheme.primaryColor,
                        inactiveTrackColor: AppTheme.primaryColor.withOpacity(0.3),
                        thumbColor: AppTheme.primaryColor,
                        overlayColor: AppTheme.primaryColor.withOpacity(0.2),
                        valueIndicatorColor: AppTheme.primaryColor,
                        valueIndicatorTextStyle: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      child: Slider(
                        value: _emotionalState,
                        min: 1,
                        max: 10,
                        divisions: 9,
                        label: _emotionalState.round().toString(),
                        onChanged: (value) {
                          setState(() {
                            _emotionalState = value;
                          });
                        },
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('1', style: Theme.of(context).textTheme.bodySmall),
                        Text('10', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Financial stress slider
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'How stressed are you about finances?',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _getFinancialLabel(_financialStress),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.secondaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: AppTheme.secondaryColor,
                        inactiveTrackColor: AppTheme.secondaryColor.withOpacity(0.3),
                        thumbColor: AppTheme.secondaryColor,
                        overlayColor: AppTheme.secondaryColor.withOpacity(0.2),
                        valueIndicatorColor: AppTheme.secondaryColor,
                        valueIndicatorTextStyle: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      child: Slider(
                        value: _financialStress,
                        min: 1,
                        max: 10,
                        divisions: 9,
                        label: _financialStress.round().toString(),
                        onChanged: (value) {
                          setState(() {
                            _financialStress = value;
                          });
                        },
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('1', style: Theme.of(context).textTheme.bodySmall),
                        Text('10', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Unexpected expenses
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Unexpected Expenses Today',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _expensesController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        hintText: 'Enter amount (optional)',
                        prefixIcon: Icon(Icons.attach_money),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Notes
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Additional Notes',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _notesController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'How was your day? Any thoughts or concerns?',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitCheckin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Submit Check-in',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
} 