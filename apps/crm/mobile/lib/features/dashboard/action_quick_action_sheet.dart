import 'package:flutter/material.dart';

import '../../core/api/crm_mobile_api.dart';
import 'work_action_sheet.dart';

Future<bool> showActionQuickActionSheet({
  required BuildContext context,
  required CrmMobileApi api,
  required UserSession session,
  required List<CrmJob> jobs,
}) async {
  if (jobs.isEmpty) return false;
  return showWorkActionSheet(
    context: context,
    api: api,
    session: session,
    enquiries: jobs,
  );
}
