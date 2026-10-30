import 'package:flutter/material.dart';

class InlineSelectOption {
  const InlineSelectOption({required this.label, required this.value});

  final String label;
  final String? value;
}

class InlineSelectField extends StatefulWidget {
  const InlineSelectField({
    required this.label,
    required this.options,
    required this.value,
    required this.onChanged,
    super.key,
  });

  final String label;
  final List<InlineSelectOption> options;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  State<InlineSelectField> createState() => _InlineSelectFieldState();
}

class _InlineSelectFieldState extends State<InlineSelectField> {
  final _portalController = OverlayPortalController();
  final _layerLink = LayerLink();
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  final _tapRegionGroup = Object();
  var _fieldWidth = 0.0;
  var _expanded = false;

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selected = widget.options
        .where((option) => option.value == widget.value)
        .firstOrNull;
    final query = _searchController.text.trim().toLowerCase();
    final visibleOptions = query.isEmpty
        ? widget.options
        : widget.options
              .where((option) => option.label.toLowerCase().contains(query))
              .toList();
    final colors = Theme.of(context).colorScheme;
    return LayoutBuilder(
      builder: (context, constraints) {
        _fieldWidth = constraints.maxWidth;
        return OverlayPortal(
          controller: _portalController,
          overlayChildBuilder: (context) => Positioned.fill(
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                CompositedTransformFollower(
                  link: _layerLink,
                  showWhenUnlinked: false,
                  targetAnchor: Alignment.bottomLeft,
                  followerAnchor: Alignment.topLeft,
                  offset: const Offset(0, 8),
                  child: TapRegion(
                    groupId: _tapRegionGroup,
                    onTapOutside: (_) => _closeMenu(),
                    child: Material(
                      color: colors.surface,
                      elevation: 8,
                      borderRadius: BorderRadius.circular(12),
                      clipBehavior: Clip.antiAlias,
                      child: SizedBox(
                        width: _fieldWidth,
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              TextField(
                                key: ValueKey('inline-search-${widget.label}'),
                                controller: _searchController,
                                autofocus: true,
                                onChanged: (_) => setState(() {}),
                                decoration: InputDecoration(
                                  isDense: true,
                                  hintText: 'Type to search',
                                  prefixIcon: const Icon(Icons.search_rounded),
                                  suffixIcon: _searchController.text.isEmpty
                                      ? null
                                      : IconButton(
                                          tooltip: 'Clear search',
                                          onPressed: () {
                                            _searchController.clear();
                                            setState(() {});
                                          },
                                          icon: const Icon(Icons.close_rounded),
                                        ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              if (visibleOptions.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Text('No matching options.'),
                                )
                              else
                                ConstrainedBox(
                                  constraints: const BoxConstraints(
                                    maxHeight: 192,
                                  ),
                                  child: Scrollbar(
                                    controller: _scrollController,
                                    thumbVisibility: true,
                                    thickness: 3,
                                    radius: const Radius.circular(3),
                                    child: ListView.builder(
                                      controller: _scrollController,
                                      shrinkWrap: true,
                                      padding: const EdgeInsets.all(4),
                                      itemCount: visibleOptions.length,
                                      itemBuilder: (context, index) {
                                        final option = visibleOptions[index];
                                        final isSelected =
                                            option.value == widget.value;
                                        return ListTile(
                                          key: ValueKey(
                                            'inline-option-${widget.label}-$index',
                                          ),
                                          dense: true,
                                          minVerticalPadding: 4,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          selected: isSelected,
                                          selectedTileColor: colors
                                              .primaryContainer
                                              .withValues(alpha: .5),
                                          title: Text(option.label),
                                          trailing: isSelected
                                              ? Icon(
                                                  Icons.check_rounded,
                                                  color: colors.primary,
                                                )
                                              : null,
                                          onTap: () {
                                            widget.onChanged(option.value);
                                            _closeMenu();
                                          },
                                        );
                                      },
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          child: TapRegion(
            groupId: _tapRegionGroup,
            child: CompositedTransformTarget(
              link: _layerLink,
              child: InkWell(
                key: ValueKey('inline-select-${widget.label}'),
                borderRadius: BorderRadius.circular(12),
                onTap: _toggleMenu,
                child: InputDecorator(
                  isFocused: _expanded,
                  decoration: InputDecoration(
                    labelText: widget.label,
                    suffixIcon: Icon(
                      _expanded
                          ? Icons.arrow_drop_up_rounded
                          : Icons.arrow_drop_down_rounded,
                    ),
                  ),
                  child: Text(selected?.label ?? ''),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _toggleMenu() {
    if (_expanded) {
      _closeMenu();
      return;
    }
    _searchController.clear();
    setState(() => _expanded = true);
    _portalController.show();
  }

  void _closeMenu() {
    if (!_expanded) return;
    setState(() => _expanded = false);
    _portalController.hide();
    _searchController.clear();
  }
}
