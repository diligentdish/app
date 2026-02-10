import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Loader2, Plus, Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [actions, setActions] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [verses, setVerses] = useState([]);

  const [newAction, setNewAction] = useState({ base_category: 'B', action_text: '', movement_text: '' });
  const [newTrigger, setNewTrigger] = useState({ 
    trigger_type: 'stressed', title: '', immediate_action: '', 
    explanation: '', body_truth: '', verse: '', verse_ref: '' 
  });
  const [newVerse, setNewVerse] = useState({ verse_text: '', verse_ref: '', category: 'general' });

  const [actionDialog, setActionDialog] = useState(false);
  const [triggerDialog, setTriggerDialog] = useState(false);
  const [verseDialog, setVerseDialog] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchAllData = async () => {
    try {
      const [actionsRes, triggersRes, versesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/actions`, { credentials: 'include', headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/triggers`, { credentials: 'include', headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/verses`, { credentials: 'include', headers: getAuthHeaders() })
      ]);

      if (actionsRes.ok) setActions(await actionsRes.json());
      if (triggersRes.ok) setTriggers(await triggersRes.json());
      if (versesRes.ok) setVerses(await versesRes.json());
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/seed`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Data seeded successfully!');
        fetchAllData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to seed data');
      }
    } catch (error) {
      toast.error('Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateAction = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/actions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(newAction)
      });

      if (response.ok) {
        toast.success('Action created!');
        setActionDialog(false);
        setNewAction({ base_category: 'B', action_text: '', movement_text: '' });
        fetchAllData();
      } else {
        toast.error('Failed to create action');
      }
    } catch (error) {
      toast.error('Failed to create action');
    }
  };

  const handleDeleteAction = async (actionId) => {
    if (!confirm('Are you sure you want to delete this action?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/actions/${actionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Action deleted');
        setActions(actions.filter(a => a.action_id !== actionId));
      }
    } catch (error) {
      toast.error('Failed to delete action');
    }
  };

  const handleCreateTrigger = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/triggers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(newTrigger)
      });

      if (response.ok) {
        toast.success('Trigger created!');
        setTriggerDialog(false);
        setNewTrigger({ 
          trigger_type: 'stressed', title: '', immediate_action: '', 
          explanation: '', body_truth: '', verse: '', verse_ref: '' 
        });
        fetchAllData();
      } else {
        toast.error('Failed to create trigger');
      }
    } catch (error) {
      toast.error('Failed to create trigger');
    }
  };

  const handleDeleteTrigger = async (triggerId) => {
    if (!confirm('Are you sure you want to delete this trigger?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/triggers/${triggerId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Trigger deleted');
        setTriggers(triggers.filter(t => t.trigger_id !== triggerId));
      }
    } catch (error) {
      toast.error('Failed to delete trigger');
    }
  };

  const handleCreateVerse = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/verses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(newVerse)
      });

      if (response.ok) {
        toast.success('Verse created!');
        setVerseDialog(false);
        setNewVerse({ verse_text: '', verse_ref: '', category: 'general' });
        fetchAllData();
      } else {
        toast.error('Failed to create verse');
      }
    } catch (error) {
      toast.error('Failed to create verse');
    }
  };

  const handleDeleteVerse = async (verseId) => {
    if (!confirm('Are you sure you want to delete this verse?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/verses/${verseId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Verse deleted');
        setVerses(verses.filter(v => v.verse_id !== verseId));
      }
    } catch (error) {
      toast.error('Failed to delete verse');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="admin-page">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-2">Admin Panel</h1>
            <p className="body">Manage BASEline actions, triggers, and verses</p>
          </div>
          <Button
            onClick={handleSeedData}
            disabled={seeding}
            variant="outline"
            data-testid="seed-data-btn"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Seed Sample Data
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="actions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="actions">Actions ({actions.length})</TabsTrigger>
            <TabsTrigger value="triggers">Triggers ({triggers.length})</TabsTrigger>
            <TabsTrigger value="verses">Verses ({verses.length})</TabsTrigger>
          </TabsList>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={actionDialog} onOpenChange={setActionDialog}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" data-testid="add-action-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Action
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add BASEline Action</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>BASE Category</Label>
                      <Select
                        value={newAction.base_category}
                        onValueChange={(val) => setNewAction({...newAction, base_category: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B">B - Become Balanced</SelectItem>
                          <SelectItem value="A">A - Activate Awareness</SelectItem>
                          <SelectItem value="S">S - Support Strength</SelectItem>
                          <SelectItem value="E">E - Engage Your Gut</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Action Text</Label>
                      <Textarea
                        value={newAction.action_text}
                        onChange={(e) => setNewAction({...newAction, action_text: e.target.value})}
                        placeholder="The daily action..."
                      />
                    </div>
                    <div>
                      <Label>Movement Text</Label>
                      <Textarea
                        value={newAction.movement_text}
                        onChange={(e) => setNewAction({...newAction, movement_text: e.target.value})}
                        placeholder="Movement suggestion..."
                      />
                    </div>
                    <Button onClick={handleCreateAction} className="w-full btn-primary">
                      Create Action
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {actions.map((action) => (
                <div key={action.action_id} className="card-custom flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`base-badge w-8 h-8 text-sm ${
                        action.base_category === 'B' ? 'base-b' :
                        action.base_category === 'A' ? 'base-a' :
                        action.base_category === 'S' ? 'base-s' : 'base-e'
                      }`}>
                        {action.base_category}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{action.action_text}</p>
                    <p className="text-sm text-muted-foreground">{action.movement_text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAction(action.action_id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Triggers Tab */}
          <TabsContent value="triggers" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={triggerDialog} onOpenChange={setTriggerDialog}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" data-testid="add-trigger-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Trigger
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Trigger Card</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Trigger Type</Label>
                      <Select
                        value={newTrigger.trigger_type}
                        onValueChange={(val) => setNewTrigger({...newTrigger, trigger_type: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stressed">Stressed</SelectItem>
                          <SelectItem value="cravings">Cravings</SelectItem>
                          <SelectItem value="low_energy">Low Energy</SelectItem>
                          <SelectItem value="after_meals">After Meals</SelectItem>
                          <SelectItem value="before_bed">Before Bed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newTrigger.title}
                        onChange={(e) => setNewTrigger({...newTrigger, title: e.target.value})}
                        placeholder="Feeling Stressed?"
                      />
                    </div>
                    <div>
                      <Label>Immediate Action</Label>
                      <Textarea
                        value={newTrigger.immediate_action}
                        onChange={(e) => setNewTrigger({...newTrigger, immediate_action: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Explanation</Label>
                      <Textarea
                        value={newTrigger.explanation}
                        onChange={(e) => setNewTrigger({...newTrigger, explanation: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Body Truth</Label>
                      <Textarea
                        value={newTrigger.body_truth}
                        onChange={(e) => setNewTrigger({...newTrigger, body_truth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Scripture Verse</Label>
                      <Textarea
                        value={newTrigger.verse}
                        onChange={(e) => setNewTrigger({...newTrigger, verse: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Verse Reference</Label>
                      <Input
                        value={newTrigger.verse_ref}
                        onChange={(e) => setNewTrigger({...newTrigger, verse_ref: e.target.value})}
                        placeholder="Matthew 11:28"
                      />
                    </div>
                    <Button onClick={handleCreateTrigger} className="w-full btn-primary">
                      Create Trigger
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {triggers.map((trigger) => (
                <div key={trigger.trigger_id} className="card-custom flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                        {trigger.trigger_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{trigger.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{trigger.immediate_action}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTrigger(trigger.trigger_id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Verses Tab */}
          <TabsContent value="verses" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={verseDialog} onOpenChange={setVerseDialog}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" data-testid="add-verse-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Verse
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Scripture Verse</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={newVerse.category}
                        onValueChange={(val) => setNewVerse({...newVerse, category: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B">B - Become Balanced</SelectItem>
                          <SelectItem value="A">A - Activate Awareness</SelectItem>
                          <SelectItem value="S">S - Support Strength</SelectItem>
                          <SelectItem value="E">E - Engage Your Gut</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Verse Text</Label>
                      <Textarea
                        value={newVerse.verse_text}
                        onChange={(e) => setNewVerse({...newVerse, verse_text: e.target.value})}
                        placeholder="The verse text..."
                      />
                    </div>
                    <div>
                      <Label>Reference</Label>
                      <Input
                        value={newVerse.verse_ref}
                        onChange={(e) => setNewVerse({...newVerse, verse_ref: e.target.value})}
                        placeholder="1 Corinthians 10:31"
                      />
                    </div>
                    <Button onClick={handleCreateVerse} className="w-full btn-primary">
                      Create Verse
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {verses.map((verse) => (
                <div key={verse.verse_id} className="card-custom flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`base-badge w-6 h-6 text-xs ${
                        verse.category === 'B' ? 'base-b' :
                        verse.category === 'A' ? 'base-a' :
                        verse.category === 'S' ? 'base-s' :
                        verse.category === 'E' ? 'base-e' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {verse.category === 'general' ? 'G' : verse.category}
                      </span>
                    </div>
                    <p className="font-medium italic mb-1">"{verse.verse_text}"</p>
                    <p className="text-sm text-muted-foreground">— {verse.verse_ref}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVerse(verse.verse_id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
