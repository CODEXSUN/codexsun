import 'package:flutter/widgets.dart';

class DashboardNavigation extends ChangeNotifier {
  int _selectedIndex = 0;
  var _menuRequested = false;
  var _jobBadgeCount = 0;

  int get selectedIndex => _selectedIndex;
  int get jobBadgeCount => _jobBadgeCount;
  void updateBadges({required int jobs}) {
    if (_jobBadgeCount == jobs) return;
    _jobBadgeCount = jobs;
    notifyListeners();
  }

  void selectContent(int index) {
    if (_selectedIndex == index) return;
    _selectedIndex = index;
    notifyListeners();
  }

  void selectDockDestination(int index) {
    if (index == 3) {
      _menuRequested = true;
      notifyListeners();
      return;
    }
    selectContent(index);
  }

  bool takeMenuRequest() {
    if (!_menuRequested) return false;
    _menuRequested = false;
    return true;
  }
}

class DashboardDockScope extends InheritedWidget {
  const DashboardDockScope({
    required this.navigation,
    required this.onDestinationSelected,
    this.onDashboardCallLogs,
    this.dockIsGlobal = false,
    required super.child,
    super.key,
  });

  final DashboardNavigation navigation;
  final ValueChanged<int> onDestinationSelected;
  final VoidCallback? onDashboardCallLogs;
  final bool dockIsGlobal;

  static DashboardDockScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<DashboardDockScope>();

  @override
  bool updateShouldNotify(DashboardDockScope oldWidget) =>
      navigation != oldWidget.navigation ||
      onDestinationSelected != oldWidget.onDestinationSelected ||
      onDashboardCallLogs != oldWidget.onDashboardCallLogs ||
      dockIsGlobal != oldWidget.dockIsGlobal;
}
