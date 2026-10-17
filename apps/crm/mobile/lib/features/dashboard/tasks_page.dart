import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/api/crm_mobile_api.dart';
import 'work_actions_page.dart';
class TasksPage extends StatefulWidget {
 const TasksPage({required this.api,required this.session,super.key});
 final CrmMobileApi api; final UserSession session;
 @override State<TasksPage> createState()=>_TasksPageState();
}
class _TasksPageState extends State<TasksPage> {
 List<Map<String,dynamic>> _items=[];String? _error;Timer? _timer;
 @override void initState(){super.initState();_load();_timer=Timer.periodic(const Duration(seconds:12),(_)=>_load());}
 @override void dispose(){_timer?.cancel();super.dispose();}
 Future<void> _load() async {try{final rows=await widget.api.tasks(widget.session.accessToken);if(mounted)setState((){_items=rows;_error=null;});}catch(error){if(mounted)setState(()=>_error='$error');}}
 @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Tasks'),actions:[IconButton(onPressed:_load,icon:const Icon(Icons.refresh))]),body:RefreshIndicator(onRefresh:_load,child:ListView(children:[if(_error!=null)ListTile(title:Text(_error!)),if(_items.isEmpty && _error==null)const ListTile(title:Text('No active tasks.')),..._items.map((row)=>ListTile(title:Text('${row['title']}'),subtitle:Text('${row['contactName']??''} · ${row['statusName']}'),trailing:const Icon(Icons.chevron_right),onTap:() async {await Navigator.of(context).push(MaterialPageRoute<void>(builder:(_)=>_TaskDetail(api:widget.api,session:widget.session,id:row['id'] as int)));await _load();}))])));
}
class _TaskDetail extends StatefulWidget {
 const _TaskDetail({required this.api,required this.session,required this.id});
 final CrmMobileApi api;final UserSession session;final int id;
 @override State<_TaskDetail> createState()=>_TaskDetailState();
}
class _TaskDetailState extends State<_TaskDetail> {
 Map<String,dynamic>? _task;List<Map<String,dynamic>> _comments=[],_closures=[];String? _error;Timer? _timer;bool _sending=false;
 @override void initState(){super.initState();_load();_timer=Timer.periodic(const Duration(seconds:10),(_)=>_load());}
 @override void dispose(){_timer?.cancel();super.dispose();}
 Future<void> _load() async {try{final data=await Future.wait([widget.api.task(widget.session.accessToken,widget.id),widget.api.taskComments(widget.session.accessToken,widget.id),widget.api.taskClosures(widget.session.accessToken,widget.id)]);if(mounted)setState((){_task=data[0] as Map<String,dynamic>;_comments=data[1] as List<Map<String,dynamic>>;_closures=data[2] as List<Map<String,dynamic>>;_error=null;});}catch(error){if(mounted)setState(()=>_error='$error');}}
 Future<void> _complete() async {setState(()=>_sending=true);try{await widget.api.requestTaskClosure(widget.session.accessToken,widget.id);await _load();}catch(error){if(mounted)setState(()=>_error='$error');}finally{if(mounted)setState(()=>_sending=false);}}
 @override Widget build(BuildContext context){final pending=_closures.any((row)=>row['status']=='pending');return Scaffold(appBar:AppBar(title:Text('${_task?['title']??'Task'}'),actions:[IconButton(onPressed:_load,icon:const Icon(Icons.refresh))]),body:ListView(padding:const EdgeInsets.all(16),children:[
 if(_error!=null)Text(_error!),Text('${_task?['description']??''}'),Text('Contact: ${_task?['contactName']??'None'} ${_task?['contactPhone']??''}'),Text('Status: ${_task?['statusName']??''}'),
 if(pending)const Text('Completion sent. Waiting for admin approval.',style:TextStyle(color:Colors.orange)),
 if(_closures.isNotEmpty && _closures.first['status']=='rejected')Text('Closure rejected: ${_closures.first['reviewNote']??''}'),
 const SizedBox(height:12),FilledButton(onPressed:()=>Navigator.of(context).push(MaterialPageRoute<void>(builder:(_)=>WorkActionsPage(api:widget.api,session:widget.session,taskId:widget.id))),child:const Text('Actions · Check in / Check out')),
 OutlinedButton(onPressed:_sending || pending || _task?['status']=='closed'?null:_complete,child:const Text('Mark completed')),
 ..._comments.map((row)=>ListTile(title:Text('${row['body']}'),subtitle:Text('${row['createdBy']} · ${row['createdAt']}')))
 ]));}
}
