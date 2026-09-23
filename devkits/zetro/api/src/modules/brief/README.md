# Zetro Brief Module

Zetro Brief owns the durable idea brief for one Zetro conversation. It verifies
that source messages belong to that conversation before it writes a draft or a
final brief.

A final brief requires at least one source-message UUID. It records either one
referred project or the shared all-projects scope.

The module depends on the public `ZetroChatConversationReader` contract. It
does not import or depend on Chat implementation files.
