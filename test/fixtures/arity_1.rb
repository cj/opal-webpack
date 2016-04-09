require 'opal'
require 'arity_2'

def two_arg(arg1, arg2)
end

begin
  onearg
rescue Exception => e
  puts e
end

begin
  two_arg 'gg'
rescue Exception => e
  puts e
end
