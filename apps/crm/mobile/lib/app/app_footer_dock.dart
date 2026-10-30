import 'package:flutter/material.dart';

const crmDockIconColor = Color(0xFF662C90);
const crmDockBackgroundColor = Color(0xFFF2E5FA);

class AppFooterDock extends StatelessWidget {
  const AppFooterDock({
    required this.selectedIndex,
    required this.onDestinationSelected,
    this.onDashboardCallLogs,
    this.onDashboardChat,
    this.dashboardMode = false,
    this.jobBadgeCount = 0,
    super.key,
  });

  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final VoidCallback? onDashboardCallLogs;
  final VoidCallback? onDashboardChat;
  final bool dashboardMode;
  final int jobBadgeCount;

  @override
  Widget build(BuildContext context) {
    final destinations = dashboardMode ? _dashboardDestinations : _destinations;
    return Material(
      color: Theme.of(context).colorScheme.surface,
      elevation: 0,
      shadowColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFF7F3F8))),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
          child: Row(
            children: List.generate(
              destinations.length,
              (index) => Expanded(
                child: _DockItem(
                  destination: destinations[index],
                  isSelected: index == _selectedDockIndex,
                  onTap: () {
                    if (dashboardMode && index == 1) {
                      onDashboardChat?.call();
                    } else if (dashboardMode && index == 2) {
                      onDashboardCallLogs?.call();
                    } else {
                      onDestinationSelected(index);
                    }
                  },
                  badgeCount: index == 1 ? jobBadgeCount : 0,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  int get _selectedDockIndex => selectedIndex;
}

class _DockItem extends StatelessWidget {
  const _DockItem({
    required this.destination,
    required this.isSelected,
    required this.onTap,
    required this.badgeCount,
  });

  final _Destination destination;
  final bool isSelected;
  final VoidCallback onTap;
  final int badgeCount;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: isSelected,
    label: destination.label,
    child: InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 54),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: _Destination.backgroundColor.withValues(
                  alpha: isSelected ? 1 : 0.55,
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    isSelected ? destination.selectedIcon : destination.icon,
                    color: _Destination.iconColor,
                    size: 24,
                  ),
                  if (badgeCount > 0)
                    Positioned(
                      top: -4,
                      right: -4,
                      child: _DockBadge(
                        label: badgeCount > 99 ? '99+' : '$badgeCount',
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              destination.label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: isSelected ? _Destination.iconColor : null,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _DockBadge extends StatelessWidget {
  const _DockBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => Container(
    constraints: const BoxConstraints(minHeight: 16, minWidth: 16),
    padding: const EdgeInsets.symmetric(horizontal: 4),
    alignment: Alignment.center,
    decoration: const BoxDecoration(
      color: Color(0xFFC62828),
      borderRadius: BorderRadius.all(Radius.circular(9)),
    ),
    child: Text(
      label,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.w700,
        height: 1,
      ),
    ),
  );
}

class _Destination {
  const _Destination({
    required this.label,
    required this.icon,
    required this.selectedIcon,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;

  static const iconColor = crmDockIconColor;
  static const backgroundColor = crmDockBackgroundColor;
}

const _destinations = [
  _Destination(
    label: 'Home',
    icon: Icons.home_outlined,
    selectedIcon: Icons.home,
  ),
  _Destination(
    label: 'Enquiries',
    icon: Icons.assignment_outlined,
    selectedIcon: Icons.assignment,
  ),
  _Destination(
    label: 'Duty',
    icon: Icons.calendar_month_outlined,
    selectedIcon: Icons.calendar_month,
  ),
  _Destination(label: 'Menu', icon: Icons.menu, selectedIcon: Icons.menu),
];

const _dashboardDestinations = [
  _Destination(
    label: 'Home',
    icon: Icons.home_outlined,
    selectedIcon: Icons.home,
  ),
  _Destination(
    label: 'Chat',
    icon: Icons.forum_outlined,
    selectedIcon: Icons.forum,
  ),
  _Destination(
    label: 'Call logs',
    icon: Icons.call_outlined,
    selectedIcon: Icons.call,
  ),
  _Destination(label: 'Menu', icon: Icons.menu, selectedIcon: Icons.menu),
];
