const supabase = require('../lib/supabaseClient');

exports.register = async (req, res) => {
    try {
        const { email, password, username, full_name } = req.body;

        // Create user in Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    full_name: full_name
                }
            }
        });

        if (authError) throw authError;

        // Create Profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    username: username,
                    full_name: full_name
                }
            ])
            .select();

        if (profileError) throw profileError;

        // Auto-login to get session token
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (loginError) throw loginError;

        res.status(201).json({
            message: 'User registered successfully',
            user: loginData.user,
            profile: profileData[0],
            session: loginData.session
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error;
        
        res.json({
            message: "Login successful",
            user: data.user,
            session: data.session
        })

    } catch (error) {
        console.log('Login Error:', error);
        res.status(400).json({error: error.message});
    }
}

exports.logout = async (req, res) => {
    try {
        const { error } = supabase.auth.signOut()

        if (error) throw error;

        res.status(200).json({ message: 'Logout successful' });

    } catch (error) {
        console.log('Logout Error', error);
        res.status(400).json({ error: error.message });
    }
}

exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.user

    // Get user's profile using Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    res.json({
      user: {
        id: user.id,
        email: user.email,
        ...profile
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(400).json({ error: error.message })
  }
}