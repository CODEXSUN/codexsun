import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/api/crm_mobile_api.dart';

class WorkActionsPage extends StatefulWidget {
 const WorkActionsPage({required this.api,required this.session,this.enquiryId,this.taskId,this.capturePosition,super.key});
 final CrmMobileApi api; final UserSession session; final int? enquiryId; final int? taskId;
 final Future<Position> Function()? capturePosition;
 @override State<WorkActionsPage> createState()=>_WorkActionsPageState();
}
class _WorkActionsPageState extends State<WorkActionsPage> with WidgetsBindingObserver {
 final _body=TextEditingController(); List<Map<String,dynamic>> _items=[];
 Map<String,dynamic>? _retry; Timer? _timer; String? _error; bool _busy=false;
 @override void initState(){super.initState();WidgetsBinding.instance.addObserver(this);_load();_timer=Timer.periodic(const Duration(seconds:10),(_)=>_load());}
 @override void dispose(){WidgetsBinding.instance.removeObserver(this);_timer?.cancel();_body.dispose();super.dispose();}
 @override void didChangeAppLifecycleState(AppLifecycleState state){if(state==AppLifecycleState.resumed)_load();}
 Future<void> _load() async {
  try {final items=await widget.api.workReports(widget.session.accessToken,enquiryId:widget.enquiryId,taskId:widget.taskId);if(mounted)setState((){_items=items;_error=null;});}
  catch(error){if(mounted)setState(()=>_error='$error');}
 }
 Future<Position> _position() async {
  if(widget.capturePosition!=null)return widget.capturePosition!();
  if(!await Geolocator.isLocationServiceEnabled())throw Exception('Turn on device location.');
  var permission=await Geolocator.checkPermission();
  if(permission==LocationPermission.denied)permission=await Geolocator.requestPermission();
  if(permission==LocationPermission.denied || permission==LocationPermission.deniedForever)throw Exception('Allow location access to check in or out.');
  return Geolocator.getCurrentPosition(locationSettings:const LocationSettings(accuracy:LocationAccuracy.high,timeLimit:Duration(seconds:20)));
 }
 Future<void> _send(String action) async {
  final body=_body.text.trim();if(action=='report' && body.isEmpty)return;
  setState(()=>_busy=true);
  try {
   if(_retry?['action']!=action || _retry?['body']!=body)_retry=null;
   if(_retry==null){
    final position=action=='report'?null:await _position();
    _retry={'enquiryId':widget.enquiryId,'taskId':widget.taskId,'action':action,'body':body,
     'requestId':'mobile-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(0x7fffffff)}',
     'latitude':position?.latitude,'longitude':position?.longitude,'accuracyMeters':position?.accuracy,'capturedAt':position?.timestamp.toUtc().toIso8601String()};
   }
   await widget.api.sendWorkReport(widget.session.accessToken,_retry!);
   _retry=null;_body.clear();await _load();
  }catch(error){if(mounted)setState(()=>_error=error is CrmMobileApiException?error.message:'$error');}
  finally{if(mounted)setState(()=>_busy=false);}
 }
 @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Actions'),actions:[IconButton(onPressed:_load,icon:const Icon(Icons.refresh))]),body:Column(children:[
  if(_error!=null)Padding(padding:const EdgeInsets.all(12),child:Text(_error!,style:TextStyle(color:Theme.of(context).colorScheme.error))),
  Padding(padding:const EdgeInsets.all(12),child:Column(children:[TextField(controller:_body,maxLines:3,onChanged:(_)=>setState((){}),decoration:const InputDecoration(labelText:'Actions taken',border:OutlineInputBorder())),const SizedBox(height:8),Wrap(spacing:8,children:[
   FilledButton(onPressed:_busy || _body.text.trim().isEmpty?null:()=>_send('report'),child:const Text('Send report')),
   OutlinedButton(onPressed:_busy?null:()=>_send('check-in'),child:const Text('Check in')),
   OutlinedButton(onPressed:_busy?null:()=>_send('check-out'),child:const Text('Check out'))])])),
  if(_busy)const LinearProgressIndicator(),
  Expanded(child:RefreshIndicator(onRefresh:_load,child:ListView.builder(physics:const AlwaysScrollableScrollPhysics(),itemCount:_items.length,itemBuilder:(context,index){final row=_items[index];return ListTile(title:Text('${row['action']} · ${row['created_by']}'),subtitle:Text('${row['body']}\n${row['created_at']}${row['latitude']==null?'':'\nGPS: ${row['latitude']}, ${row['longitude']} · ${row['accuracy_meters']} m\nCaptured: ${row['captured_at']}'}'));})))
 ]));
}
