import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      // Known columns in the profiles table
      // All columns including health_conditions and allergies are now in the schema
      const validColumns = [
        'full_name', 'avatar_url', 'bio', 'age', 'weight', 'height', 
        'weight_goal', 'gender', 'activity_level', 'dietary_preferences', 
        'health_conditions', 'allergies', 'daily_calorie_goal'
      ];
      
      // Check if health_conditions and allergies columns exist
      // These columns are now included in the complete_database_schema.sql
      const hasHealthColumns = true; // Set to true after running complete_database_schema.sql

      // Filter out any undefined or null values AND only include valid columns
      const cleanUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          // Include if it's a valid column
          if (validColumns.includes(key)) {
            cleanUpdates[key] = value;
          }
          // Include health_conditions and allergies only if columns exist
          else if ((key === 'health_conditions' || key === 'allergies') && hasHealthColumns) {
            cleanUpdates[key] = value;
          }
          // For now, skip health_conditions and allergies to avoid errors
          // Remove this else block after running add_profile_columns.sql
        }
      }

      // Log if we're filtering out columns (for debugging)
      const filteredOut = Object.keys(updates).filter(key => 
        !validColumns.includes(key) && 
        (key !== 'health_conditions' && key !== 'allergies' || !hasHealthColumns)
      );
      if (filteredOut.length > 0) {
        console.log('Filtered out columns (may need SQL migration):', filteredOut);
      }

      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      let result;

      if (existingProfile) {
        // Profile exists - update it
        const { data, error } = await supabase
          .from('profiles')
          .update(cleanUpdates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          // If error is about missing columns, try without those columns
          if (error.code === 'PGRST204' && error.message?.includes('column')) {
            console.warn('Column not found in schema, removing it from update:', error.message);
            // Extract column name from error message
            const columnMatch = error.message.match(/column '(\w+)'/);
            if (columnMatch) {
              const columnName = columnMatch[1];
              delete cleanUpdates[columnName];
              // Retry without the problematic column
              const { data: retryData, error: retryError } = await supabase
                .from('profiles')
                .update(cleanUpdates)
                .eq('id', user.id)
                .select()
                .single();
              
              if (retryError) throw retryError;
              result = { data: retryData, error: null };
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        } else {
          result = { data, error: null };
        }
      } else {
        // Profile doesn't exist - create it
        const fullName = user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'User';
        
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            ...cleanUpdates,
          })
          .select()
          .single();

        if (error) {
          // If error is about missing columns, try without those columns
          if (error.code === 'PGRST204' && error.message?.includes('column')) {
            console.warn('Column not found in schema, removing it from insert:', error.message);
            const columnMatch = error.message.match(/column '(\w+)'/);
            if (columnMatch) {
              const columnName = columnMatch[1];
              delete cleanUpdates[columnName];
              // Retry without the problematic column
              const { data: retryData, error: retryError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  full_name: fullName,
                  ...cleanUpdates,
                })
                .select()
                .single();
              
              if (retryError) throw retryError;
              result = { data: retryData, error: null };
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        } else {
          result = { data, error: null };
        }
      }

      // Update profile state
      setProfile(result.data);
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};