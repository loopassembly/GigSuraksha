import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../config/theme.dart';
import 'dashboard_screen.dart';
import 'gps_tracking_screen.dart';
import 'intelligence_screen.dart';
import 'profile_screen.dart';
import 'simulate_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIdx = 0;

  static const _tabs = [
    _Tab('Home', Icons.home_outlined, Icons.home_rounded, DashboardScreen()),
    _Tab(
      'Intel',
      Icons.insights_outlined,
      Icons.insights_rounded,
      IntelligenceScreen(),
    ),
    _Tab('Simulate', Icons.bolt_outlined, Icons.bolt_rounded, SimulateScreen()),
    _Tab(
      'GPS',
      Icons.location_on_outlined,
      Icons.location_on_rounded,
      GpsTrackingScreen(),
    ),
    _Tab(
      'Profile',
      Icons.person_outline_rounded,
      Icons.person_rounded,
      ProfileScreen(),
    ),
  ];

  void _onTab(int idx) {
    if (_currentIdx == idx) return;
    HapticFeedback.selectionClick();
    setState(() => _currentIdx = idx);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _currentIdx,
        children: _tabs.map((t) => t.screen).toList(),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(
            top: BorderSide(
              color: AppColors.border.withValues(alpha: 0.5),
              width: 0.5,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 64,
            child: Row(
              children: List.generate(_tabs.length, (idx) {
                final tab = _tabs[idx];
                final selected = idx == _currentIdx;

                return Expanded(
                  child: GestureDetector(
                    onTap: () => _onTab(idx),
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primaryDark.withValues(alpha: 0.12)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(
                            selected ? tab.activeIcon : tab.icon,
                            size: 22,
                            color: selected
                                ? AppColors.primaryDark
                                : AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          tab.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: selected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: selected
                                ? AppColors.primaryDark
                                : AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _Tab {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final Widget screen;

  const _Tab(this.label, this.icon, this.activeIcon, this.screen);
}
