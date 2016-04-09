require "opal"
require "opal-source-maps"
require "opal-parser"
require "pathname"

# MRI implement `begin/end while condition` differently
# See issue: https://github.com/opal/opal/issues/575
# https://github.com/opal/opal/pull/1426 should fix this

unless SourceMap::VLQ.encode([0]) == 'A'
  module SourceMap
    module VLQ
      def self.encode(ary)
        result = []
        ary.each do |n|
          vlq = n < 0 ? ((-n) << 1) + 1 : n << 1
          loop do
            digit  = vlq & VLQ_BASE_MASK
            vlq  >>= VLQ_BASE_SHIFT
            digit |= VLQ_CONTINUATION_BIT if vlq > 0
            result << BASE64_DIGITS[digit]
            break unless vlq > 0
          end
        end
        result.join
      end
    end
  end
end

# Opal issues:
# 1. dirname doesn't work right for File.dirname('stuff'). none of the specs are turned on
# 2. Pathname.join doesn't work right
# bundle exec opal -e "require 'pathname'; puts Pathname('.').join('./tree')" returns '././tree'
# ruby -e "require 'pathname'; puts Pathname('.').join('./tree')" returns 'tree'
# 3. Pathname.cleanpath not working (see below)
# Backports from opal 0.10
unless Pathname.method_defined?(:+) && Pathname.method_defined?(:join)
  class Pathname
    def +(other)
      other = Pathname.new(other) unless Pathname === other
      Pathname.new(File.join(@path, other.to_path))
    end

    def join(*args)
      args.unshift self
      result = args.pop
      result = Pathname.new(result) unless Pathname === result
      return result if result.absolute?
      args.reverse_each {|arg|
        arg = Pathname.new(arg) unless Pathname === arg
        result = arg + result
        return result if result.absolute?
      }
      result
    end
  end
end

# Fixed in Opal 0.10
if `Opal.normalize === undefined`
  class Pathname
    def cleanpath
      %x{
        var path = #@path;
        var parts, part, new_parts = [], SEPARATOR = '/';

        if (Opal.current_dir !== '.') {
          path = Opal.current_dir.replace(/\/*$/, '/') + path;
        }

        path = path.replace(/\.(rb|opal|js)$/, '');
        parts = path.split(SEPARATOR);

        for (var i = 0, ii = parts.length; i < ii; i++) {
          part = parts[i];
          if (part === '') continue;
          (part === '..') ? new_parts.pop() : new_parts.push(part)
        }

        return new_parts.join(SEPARATOR);
      }
    end
  end
end

regexp_escaped_trailing_ok = begin
  Regexp.new('\\A[A-Z]:\\\\')
  true
  rescue RegexpError => _
    false
end

# https://github.com/opal/opal/pull/1422
# prevents RSpec compilation
unless regexp_escaped_trailing_ok
  class Regexp
    class << self
      def new(regexp, options = undefined)
        %x{
          if (regexp.$$is_regexp) {
            return new RegExp(regexp);
          }

          regexp = #{Opal.coerce_to!(regexp, String, :to_str)};

          if (regexp.charAt(regexp.length - 1) === '\\' && regexp.charAt(regexp.length - 2) !== '\\') {
            #{raise RegexpError, "too short escape sequence: /#{regexp}/"}
          }

          if (options === undefined || #{!options}) {
            return new RegExp(regexp);
          }

          if (options.$$is_number) {
            var temp = '';
            if (#{IGNORECASE} & options) { temp += 'i'; }
            if (#{MULTILINE}  & options) { temp += 'm'; }
            options = temp;
          }
          else {
            options = 'i';
          }

          return new RegExp(regexp, options);
        }
      end
    end
  end
end

# https://github.com/opal/opal/pull/1426
# https://github.com/opal/opal/issues/1427
begin
  Opal::Compiler.new('def problem', {}).compile
rescue Exception => e
  unless e.is_a?(SyntaxError) && e.message == "An error occurred while compiling: (file)\n\nunexpected 'false'\nSource: (file):1:11
def problem\n~~~~~~~~~~^"
    class Opal::Compiler
      def compile
        @parser = Parser.new

        @sexp = s(:top, @parser.parse(@source, self.file) || s(:nil))
        @eof_content = @parser.lexer.eof_content

        @fragments = process(@sexp).flatten

        @result = @fragments.map(&:code).join('')
      rescue Exception => error
        message = "An error occurred while compiling: #{self.file}\n#{error.message}"
        raise error.class, message, error.backtrace
      end
    end
  end
end
