import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock, CheckCircle, AlertCircle, Plus, ArrowRight } from "@/lib/icons";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'away' | 'offline';
}

interface PendingTask {
  id: string;
  title: string;
  assignee: TeamMember;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  type: 'review' | 'content' | 'approval';
}

interface RecentActivity {
  id: string;
  user: TeamMember;
  action: string;
  target: string;
  timestamp: string;
  type: 'created' | 'edited' | 'completed' | 'commented';
}

interface TeamActivityOverviewProps {
  teamMembers?: TeamMember[];
  pendingTasks?: PendingTask[];
  recentActivity?: RecentActivity[];
}

const TeamActivityOverview = React.memo(({ 
  teamMembers = [], 
  pendingTasks = [], 
  recentActivity = [] 
}: TeamActivityOverviewProps) => {
  // Mock data for demonstration
  const mockTeamMembers: TeamMember[] = [
    { id: '1', name: 'Sarah Chen', role: 'Content Manager', status: 'online' },
    { id: '2', name: 'Mike Rodriguez', role: 'Designer', status: 'away' },
    { id: '3', name: 'Emily Davis', role: 'Marketing Lead', status: 'online' },
    { id: '4', name: 'James Wilson', role: 'Copywriter', status: 'offline' }
  ];

  const mockPendingTasks: PendingTask[] = [
    {
      id: '1',
      title: 'Review Q2 Email Campaign',
      assignee: mockTeamMembers[0],
      dueDate: '2024-01-20',
      priority: 'high',
      type: 'review'
    },
    {
      id: '2',
      title: 'Approve Social Media Content',
      assignee: mockTeamMembers[2],
      dueDate: '2024-01-18',
      priority: 'medium',
      type: 'approval'
    },
    {
      id: '3',
      title: 'Create Landing Page Copy',
      assignee: mockTeamMembers[3],
      dueDate: '2024-01-22',
      priority: 'low',
      type: 'content'
    }
  ];

  const mockRecentActivity: RecentActivity[] = [
    {
      id: '1',
      user: mockTeamMembers[0],
      action: 'created',
      target: 'Summer Newsletter Template',
      timestamp: '2 hours ago',
      type: 'created'
    },
    {
      id: '2',
      user: mockTeamMembers[1],
      action: 'edited',
      target: 'Product Launch Email',
      timestamp: '4 hours ago',
      type: 'edited'
    },
    {
      id: '3',
      user: mockTeamMembers[2],
      action: 'completed',
      target: 'Social Media Campaign',
      timestamp: '6 hours ago',
      type: 'completed'
    }
  ];

  const displayTeamMembers = teamMembers.length > 0 ? teamMembers : mockTeamMembers;
  const displayPendingTasks = pendingTasks.length > 0 ? pendingTasks : mockPendingTasks;
  const displayRecentActivity = recentActivity.length > 0 ? recentActivity : mockRecentActivity;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-error text-error-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return Plus;
      case 'completed': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Members Overview */}
      <Card id="team-overview-card" className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border border-border/50 hover:shadow-elegant hover:shadow-primary/5 transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Team Overview
              </CardTitle>
              <CardDescription>
                {displayTeamMembers.filter(m => m.status === 'online').length} of {displayTeamMembers.length} members online
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" aria-label="Invite team member">
              <Plus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          <div className="grid grid-cols-1 gap-2">
            {displayTeamMembers.slice(0, 4).map((member) => (
              <div 
                key={member.id} 
                id={`team-member-${member.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`View ${member.name} profile - ${member.status}`}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}
                    aria-label={`${member.status} status`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card id="pending-tasks-card" className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border border-border/50 hover:shadow-elegant hover:shadow-primary/5 transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Pending Tasks
              </CardTitle>
              <CardDescription>
                {displayPendingTasks.length} items require attention
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary" aria-label="View all pending tasks">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          {displayPendingTasks.map((task) => (
            <div 
              key={task.id} 
              id={`pending-task-${task.id}`}
              className="flex items-center gap-3 p-2 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Task: ${task.title} - ${task.priority} priority, due ${new Date(task.dueDate).toLocaleDateString()}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground line-clamp-1">{task.title}</span>
                  <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Assigned to {task.assignee.name}</span>
                  <span>•</span>
                  <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card id="recent-activity-card" className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border border-border/50 hover:shadow-elegant hover:shadow-primary/5 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-info" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest team updates and changes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          {displayRecentActivity.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type);
            return (
              <div 
                key={activity.id} 
                id={`recent-activity-${activity.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                role="button"
                tabIndex={0}
                aria-label={`${activity.user.name} ${activity.action} ${activity.target} ${activity.timestamp}`}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <ActivityIcon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">
                    <span className="font-medium">{activity.user.name}</span>
                    <span className="text-muted-foreground"> {activity.action} </span>
                    <span className="font-medium truncate">{activity.target}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
});

TeamActivityOverview.displayName = 'TeamActivityOverview';

export default TeamActivityOverview;