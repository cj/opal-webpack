# simulate a Rails environment
raise 'expected RAILS_ENV to be set to foobar' unless ENV['RAILS_ENV'] == 'foobar'
require 'opal'
require 'opal-browser'
